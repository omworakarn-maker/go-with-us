import prisma from '../utils/prismaClient.js';
import { sendPushNotification } from '../utils/firebase.js';
import { cosineSimilarity } from '../utils/ai.js';


// Helper to normalize legacy and new travel styles
const normalizeTravelStyle = (style) => {
    if (!style || typeof style !== 'object') return null;
    
    let budget = null;
    if (style.budget !== undefined) {
        if (typeof style.budget === 'number') budget = style.budget;
        else if (style.budget === 'budget') budget = 2;
        else if (style.budget === 'moderate') budget = 5;
        else if (style.budget === 'luxury') budget = 8;
        else if (!isNaN(Number(style.budget))) budget = Number(style.budget);
        
        // Map large THB values to 1-10 rating scale to fix massive vector magnitudes
        if (budget > 10) {
            if (budget <= 500) budget = 2;
            else if (budget <= 1000) budget = 4;
            else if (budget <= 2000) budget = 6;
            else if (budget <= 5000) budget = 8;
            else budget = 10;
        }
    }
    
    let activityStyle = null;
    if (style.activityStyle !== undefined) {
        if (typeof style.activityStyle === 'number') activityStyle = style.activityStyle;
        else if (!isNaN(Number(style.activityStyle))) activityStyle = Number(style.activityStyle);
    } else if (style.pace !== undefined) {
        if (style.pace === 'relaxed') activityStyle = 2;
        else if (style.pace === 'moderate') activityStyle = 5;
        else if (style.pace === 'fast') activityStyle = 8;
    }
    
    let timeOfDay = [];
    if (Array.isArray(style.timeOfDay)) {
        timeOfDay = style.timeOfDay;
    }
    
    return { budget, activityStyle, timeOfDay };
};

const MATCH_WEIGHTS = {
    category: 0.35,
    budget: 0.30,
    activityStyle: 0.20,
    timeOfDay: 0.15
};

const MATCH_CATEGORIES = ['ทะเล', 'ภูเขา', 'แคมป์ปิ้ง', 'เที่ยวเมือง', 'คาเฟ่', 'อาหาร', 'แฮงเอาต์', 'ถ่ายรูป', 'ช้อปปิ้ง', 'คอนเสิร์ต', 'ผจญภัย', 'ไหว้พระ', 'อื่นๆ'];
const MATCH_TIMES = ['morning', 'noon', 'evening', 'night'];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const encodeMultiHotUnit = (selected, universe) => {
    const selectedSet = new Set(Array.isArray(selected) ? selected : []);
    const raw = universe.map(value => selectedSet.has(value) ? 1 : 0);
    const norm = Math.sqrt(raw.reduce((sum, value) => sum + (value * value), 0));
    return norm > 0 ? raw.map(value => value / norm) : raw;
};

const blockCosinePercentage = (userBlock, tripBlock) => (
    Math.round(clamp(cosineSimilarity(userBlock, tripBlock), 0, 1) * 100)
);



// ฟังก์ชันคำนวณความเข้ากันได้ระหว่างผู้ใช้ 2 คน (ใช้สำหรับหาบัดดี้ - Find Buddy)
// โดยคิดคะแนนจาก 4 ปัจจัยหลัก: งบประมาณ, สไตล์การทำกิจกรรม, ช่วงเวลาที่ชอบ, และความสนใจ
const calculateDetailedCompatibility = (userA, userB) => {
    // จัดรูปแบบข้อมูลสไตล์การท่องเที่ยวของ User A ให้เป็นมาตรฐานเดียวกัน (ดึง budget, activityStyle, timeOfDay ออกมา)
    const styleA = normalizeTravelStyle(userA.travelStyle);
    // จัดรูปแบบข้อมูลสไตล์การท่องเที่ยวของ User B ให้เป็นมาตรฐานเดียวกัน
    const styleB = normalizeTravelStyle(userB.travelStyle);

    // ตัวแปรเก็บคะแนนรวมสะสมของการคำนวณ
    let totalScore = 0;
    // ตัวแปรเก็บน้ำหนักรวมสะสม เพื่อนำไปหารเป็นเปอร์เซ็นต์ในตอนท้าย
    let totalWeight = 0;

    // 1. งบประมาณ (Budget) - น้ำหนัก 3
    // ตรวจสอบว่ามีข้อมูลสไตล์และข้อมูลงบประมาณของทั้งสองคนหรือไม่
    if (styleA && styleA.budget !== null && styleB && styleB.budget !== null) {
        // หาผลต่างสัมบูรณ์ของระดับงบประมาณ (สเกล 1-10)
        const diff = Math.abs(styleA.budget - styleB.budget);
        // ตั้งค่าคะแนนเริ่มต้นเต็ม 1.0 (หากงบตรงกันหรือห่างกันไม่เกิน 1 ระดับ)
        let score = 1.0;
        // หากระดับงบประมาณห่างกันเกิน 1 ระดับ (เช่น 3 กับ 5 ห่างกัน 2)
        if (diff > 1) {
            // หักคะแนนตามสัดส่วนความห่าง (หักออก 1/8 ต่อความห่าง 1 ระดับ) โดยคะแนนต่ำสุดคือ 0
            score = Math.max(0, 1.0 - ((diff - 1) / 8.0));
        }
        // นำคะแนนที่ได้คูณด้วยน้ำหนัก 3 แล้วบวกเข้าคะแนนรวมสะสม
        totalScore += score * 3;
        // บวกค่าน้ำหนัก 3 เข้าค่าน้ำหนักรวมสะสม
        totalWeight += 3;
    } else {
        // กรณีที่คนใดคนหนึ่งไม่มีข้อมูลงบประมาณ ให้คะแนนระดับกลาง (0.5) 
        totalScore += 0.5 * 1;
        // ปรับลดน้ำหนักปัจจัยนี้เหลือ 1 เพื่อไม่ให้ดึงคะแนนโดยรวมมากเกินไป
        totalWeight += 1;
    }

    // 2. สไตล์การทำกิจกรรม (Activity Style) - น้ำหนัก 2
    // ตรวจสอบว่ามีข้อมูลสไตล์การทำกิจกรรมของทั้งสองคนหรือไม่ (สเกล 1-10)
    if (styleA && styleA.activityStyle !== null && styleB && styleB.activityStyle !== null) {
        // หาผลต่างของสไตล์การทำกิจกรรม
        const diff = Math.abs(styleA.activityStyle - styleB.activityStyle);
        // ให้คะแนนเริ่มต้นเต็ม 1.0
        let score = 1.0;
        // หากสไตล์การทำกิจกรรมต่างกันเกิน 1 ระดับ
        if (diff > 1) {
            // หักคะแนนออกตามสัดส่วนแบบเดียวกับการคำนวณงบประมาณ
            score = Math.max(0, 1.0 - ((diff - 1) / 8.0));
        }
        // นำคะแนนที่ได้คูณน้ำหนัก 2 ลงในคะแนนรวมสะสม
        totalScore += score * 2;
        // บวกค่าน้ำหนัก 2 ลงในน้ำหนักรวมสะสม
        totalWeight += 2;
    } else {
        // กรณีขาดข้อมูล ให้คะแนน 0.5 โดยลดน้ำหนักปัจจัยนี้เหลือ 1
        totalScore += 0.5 * 1;
        totalWeight += 1;
    }

    // 3. ช่วงเวลาของวัน (Time of Day) - น้ำหนัก 1 (หรือ 1.5)
    // ตรวจสอบว่าทั้งสองคนมีการเลือกช่วงเวลาที่ชอบไว้หรือไม่
    if (styleA && styleA.timeOfDay && styleA.timeOfDay.length > 0 && 
        styleB && styleB.timeOfDay && styleB.timeOfDay.length > 0) {
        // หาจำนวนช่วงเวลาที่ทั้งสองคนเลือกตรงกัน (Intersect)
        const intersect = styleA.timeOfDay.filter(x => styleB.timeOfDay.includes(x)).length;
        // หาจำนวนช่วงเวลาทั้งหมดที่ทั้งสองคนเลือกรวมกันโดยไม่ซ้ำ (Union)
        const union = new Set([...styleA.timeOfDay, ...styleB.timeOfDay]).size;
        // คำนวณความคล้ายคลึงแบบ Jaccard index (ตรงกัน / ทั้งหมด)
        const score = union > 0 ? (intersect / union) : 0.0;
        
        // ให้โบนัสน้ำหนักเป็น 1.5 เพื่อให้ความสำคัญกับคนที่ว่างช่วงเวลาเดียวกัน
        totalScore += score * 1.5;
        // บวกค่าน้ำหนัก 1.5
        totalWeight += 1.5;
    } else {
        // กรณีขาดข้อมูล ให้คะแนน 0.5 โดยมีค่าน้ำหนัก 0.5
        totalScore += 0.5 * 0.5;
        totalWeight += 0.5;
    }

    // 4. ความสนใจ (Interests) - น้ำหนัก 2
    // ดึงอาร์เรย์ความสนใจของ User A หรือใช้อาร์เรย์ว่างหากไม่มีข้อมูล
    const intA = Array.isArray(userA.interests) ? userA.interests : [];
    // ดึงอาร์เรย์ความสนใจของ User B หรือใช้อาร์เรย์ว่างหากไม่มีข้อมูล
    const intB = Array.isArray(userB.interests) ? userB.interests : [];
    
    // ตรวจสอบว่าทั้งคู่มีความสนใจระบุไว้อย่างน้อย 1 อย่าง
    if (intA.length > 0 && intB.length > 0) {
        // หาจำนวนความสนใจที่ตรงกันระหว่างสองคน
        const intersect = intA.filter(x => intB.includes(x)).length;
        // คำนวณ Dice coefficient (2 * ส่วนที่ตรงกัน / ผลรวมจำนวนความสนใจของทั้งคู่)
        const score = (2.0 * intersect) / (intA.length + intB.length);
        // นำคะแนนคูณน้ำหนัก 2 เข้าคะแนนรวมสะสม
        totalScore += score * 2;
        // บวกน้ำหนัก 2
        totalWeight += 2;
    } else {
        // กรณีขาดข้อมูล ให้คะแนน 0.5 โดยน้ำหนัก 1
        totalScore += 0.5 * 1;
        totalWeight += 1;
    }

    // ตัวแปรสำหรับคำนวณเปอร์เซ็นต์
    let percentage = 0;
    // หากมีการคำนวณน้ำหนักเกิดขึ้น
    if (totalWeight > 0) {
        // หาเปอร์เซ็นต์โดยนำคะแนนรวมหารน้ำหนักรวม แล้วคูณ 100
        percentage = (totalScore / totalWeight) * 100.0;
    }
    
    // ตรวจสอบไม่ให้เปอร์เซ็นต์เกิน 100
    if (percentage > 100) percentage = 100;
    // ตรวจสอบไม่ให้เปอร์เซ็นต์ติดลบ
    if (percentage < 0) percentage = 0;
    
    // ส่งคืนค่าเป็นจำนวนเต็ม (ปัดเศษ)
    return Math.round(percentage);
};

// Helper to map rating (1-10) to THB
const mapRatingToBudget = (rating) => {
    if (rating === 0 || rating === "0") return 0;
    const r = Number(rating) || 5;
    if (r > 10) return r; // Already in THB
    if (r <= 2) return 500;
    if (r <= 4) return 1000;
    if (r <= 6) return 2000;
    if (r <= 8) return 5000;
    return 8000;
};

// Helper to map THB to rating (1-10)
const mapBudgetToRating = (thb) => {
    if (!thb) return 5;
    if (thb <= 500) return 2;
    if (thb <= 1000) return 4;
    if (thb <= 2000) return 6;
    if (thb <= 5000) return 8;
    return 10;
};

// Helper to calculate exact user-to-trip compatibility percentage
export const calculateTripCompatibility = (user, trip) => {
    const result = calculateTripCompatibilityDetailed(user, trip);
    return result.total;
};

// ฟังก์ชันคำนวณความเข้ากันได้ระหว่าง "ผู้ใช้" กับ "ทริป" แบบละเอียด (ใช้สำหรับ Match Trips)
// โดยใช้หลักการ Cosine Similarity เพื่อเทียบเวกเตอร์ของคุณลักษณะผู้ใช้กับคุณลักษณะทริป
export const calculateTripCompatibilityDetailed = (user, trip) => {
    // จัดรูปแบบข้อมูลสไตล์การท่องเที่ยวของผู้ใช้ (User)
    const styleU = normalizeTravelStyle(user.travelStyle);
    // จัดรูปแบบข้อมูลสไตล์การท่องเที่ยวของผู้สร้างทริป (Creator)
    const styleC = normalizeTravelStyle(trip.creator && trip.creator.travelStyle ? trip.creator.travelStyle : null);
    
    // โครงสร้าง Object สำหรับเก็บคะแนนแยกย่อยของแต่ละปัจจัย เพื่อนำไปแสดงผลบน UI (Breakdown)
    const breakdown = {
        budget: null, // ค่าคะแนนย่อยด้านงบประมาณ
        activityStyle: null, // ค่าคะแนนย่อยด้านสไตล์กิจกรรม
        category: null, // ค่าคะแนนย่อยด้านความสนใจ/หมวดหมู่
        timeOfDay: null, // ค่าคะแนนย่อยด้านช่วงเวลา
        groupMatch: null // ค่าสถานะการเข้ากลุ่ม (ถ้าเต็มจะเป็น 0)
    };

    // นับจำนวนผู้เข้าร่วมทริปปัจจุบัน (เฉพาะคนที่ไม่มี status หรือ status เป็น 'going')
    const goingCount = Array.isArray(trip.participants)
        ? trip.participants.filter(participant => !participant.status || participant.status === 'going').length
        : 0;
    // ตรวจสอบว่าทริปจำกัดคนและคนเต็มหรือยัง
    if (trip.maxParticipants && goingCount >= Number(trip.maxParticipants)) {
        // หากคนเต็ม ให้คะแนน groupMatch เป็น 0
        breakdown.groupMatch = 0;
        // ส่งคืนค่าคะแนนรวมและย่อยเป็น 0 ทั้งหมด เพราะไม่สามารถร่วมทริปได้
        return { total: 0, breakdown, tripMatch: 0 };
    }

    // ดึงวันที่สิ้นสุดของทริป หรือถ้าไม่มีใช้วันที่เริ่มต้น
    const lastTripDate = trip.endDate || trip.startDate;
    // ตรวจสอบว่ามีข้อมูลวันที่หรือไม่
    if (lastTripDate) {
        // แปลงวันที่สิ้นสุดเป็นออบเจกต์ Date
        const tripDay = new Date(lastTripDate);
        // สร้างออบเจกต์ Date ของวันปัจจุบัน
        const today = new Date();
        // ตั้งเวลาของวันสิ้นสุดทริปเป็นวินาทีสุดท้ายของวัน (23:59:59.999)
        tripDay.setHours(23, 59, 59, 999);
        // ถ้าระยะเวลาสิ้นสุดทริปผ่านมาแล้ว (น้อยกว่าวันปัจจุบัน)
        if (tripDay < today) {
            // ส่งคืนค่า 0 ทั้งหมด เพราะทริปจบลงไปแล้ว
            return { total: 0, breakdown, tripMatch: 0 };
        }
    }

    // 1. การคำนวณเวกเตอร์ด้านงบประมาณ (น้ำหนัก 30%)
    // ดึงค่างบประมาณดิบจากผู้ใช้
    const rawUserBudget = user.travelStyle && Number(user.travelStyle.budget);
    // แปลงงบผู้ใช้เป็นหน่วยบาท (THB) ถ้าน้อยกว่า 10 จะแปลงจากเรทติ้งเป็นเงิน ถ้าเกิน 10 คือค่าเงินโดยตรง
    const userBudgetTHB = styleU && styleU.budget !== null
        ? (Number.isFinite(rawUserBudget) && rawUserBudget > 10
            ? rawUserBudget
            : mapRatingToBudget(styleU.budget))
        : null;
    // ดึงค่างบประมาณของทริป (THB)
    const tripBudgetTHB = trip.budget !== undefined && trip.budget !== null
        ? Number(trip.budget)
        : null;
        
    // ตรวจสอบว่ามีข้อมูลงบประมาณทั้งสองฝั่ง
    if (userBudgetTHB !== null && Number.isFinite(tripBudgetTHB)) {
        // ต่ำกว่า 50% ของงบทริปถือว่าไม่เหมาะสมและได้ 0%
        // ตั้งแต่ 50% ขึ้นไปคิดตามสัดส่วน และถ้างบเพียงพอได้เต็ม 100%
        if (tripBudgetTHB === 0 || userBudgetTHB >= tripBudgetTHB) {
            breakdown.budget = 100;
        } else if (userBudgetTHB < tripBudgetTHB * 0.5) {
            breakdown.budget = 0;
        } else {
            breakdown.budget = Math.round((userBudgetTHB / tripBudgetTHB) * 100);
        }

    }

    // 2. การคำนวณเวกเตอร์ด้านสไตล์การทำกิจกรรม (น้ำหนัก 20%)
    // ดึงสไตล์ของทริป (ถ้าทริปไม่ระบุ ให้ดึงจากผู้สร้างทริปแทน)
    const tripPace = trip.activityStyle != null ? trip.activityStyle : (styleC ? styleC.activityStyle : null);
    // ตรวจสอบว่ามีข้อมูลกิจกรรมทั้งสองฝั่ง
    if (styleU && styleU.activityStyle !== null && tripPace !== null) {
        // ค่าที่ระบบใช้จริงคือ 2, 5 และ 8 จึงมีระยะห่างสูงสุด 8 - 2 = 6
        const activityDifference = Math.abs(
            clamp(Number(styleU.activityStyle), 1, 10) - clamp(Number(tripPace), 1, 10)
        );
        breakdown.activityStyle = Math.round(
            clamp(1 - (activityDifference / 6), 0, 1) * 100
        );

    }

    // 3. การคำนวณเวกเตอร์ด้านช่วงเวลาของวัน (น้ำหนัก 15%)
    // ดึงข้อมูลช่วงเวลาของทริป หรือดึงจากผู้สร้างทริปถ้าไม่มี
    const tripTime = (trip.timeOfDay && trip.timeOfDay.length > 0) ? trip.timeOfDay : (styleC ? styleC.timeOfDay : []);
    // ตรวจสอบว่ามีข้อมูลเวลาทั้งคู่
    if (styleU && styleU.timeOfDay && styleU.timeOfDay.length > 0 && tripTime && tripTime.length > 0) {
        // แปลงอาร์เรย์เวลาของผู้ใช้เป็น Multi-hot vector ตามลิสต์ MATCH_TIMES
        const userTimeBlock = encodeMultiHotUnit(styleU.timeOfDay, MATCH_TIMES);
        // แปลงอาร์เรย์เวลาของทริปเป็น Multi-hot vector
        const tripTimeBlock = encodeMultiHotUnit(tripTime, MATCH_TIMES);
        
        // ถ้าทั้งคู่มีข้อมูลที่ตรงรูปแบบอย่างน้อย 1 ตัว
        if (userTimeBlock.some(Boolean) && tripTimeBlock.some(Boolean)) {
            breakdown.timeOfDay = blockCosinePercentage(userTimeBlock, tripTimeBlock);
        }
    }

    // 4. การคำนวณเวกเตอร์ด้านความสนใจและหมวดหมู่ทริป (น้ำหนัก 35%)
    // ตรวจสอบและดึงอาร์เรย์ความสนใจของผู้ใช้
    const userInterests = Array.isArray(user.interests) ? user.interests : [];
    // รวมหมวดหลักกับความชอบเพิ่มเติมของทริป (ไม่เกิน 3 หมวดและไม่ซ้ำกัน)
    const tripInterests = [...new Set([
        ...(trip.category ? [trip.category] : []),
        ...(Array.isArray(trip.interestTags) ? trip.interestTags : [])
    ])].filter(category => MATCH_CATEGORIES.includes(category)).slice(0, 3);
    // ตรวจสอบว่าทริปมีหมวดหมู่และผู้ใช้มีความสนใจ
    if (tripInterests.length > 0 && userInterests.length > 0) {
        // แปลงความสนใจผู้ใช้เป็น Multi-hot vector
        const userCategoryBlock = encodeMultiHotUnit(userInterests, MATCH_CATEGORIES);
        // แปลงหมวดหลักและหมวดเสริมของทริปเป็น Multi-hot vector เดียวกัน
        const tripCategoryBlock = encodeMultiHotUnit(tripInterests, MATCH_CATEGORIES);
        
        // ถ้าข้อมูลมีอยู่จริง
        if (userCategoryBlock.some(Boolean) && tripCategoryBlock.some(Boolean)) {
            breakdown.category = blockCosinePercentage(userCategoryBlock, tripCategoryBlock);
        }
    }

    // รวมคะแนนย่อยด้วยค่าเฉลี่ยถ่วงน้ำหนัก
    const weightedBreakdown = [
        [breakdown.category, MATCH_WEIGHTS.category],
        [breakdown.budget, MATCH_WEIGHTS.budget],
        [breakdown.activityStyle, MATCH_WEIGHTS.activityStyle],
        [breakdown.timeOfDay, MATCH_WEIGHTS.timeOfDay]
    ].filter(([score]) => score !== null && Number.isFinite(score));
    const availableWeight = weightedBreakdown.reduce((sum, [, weight]) => sum + weight, 0);
    const weightedScore = weightedBreakdown.reduce(
        (sum, [score, weight]) => sum + (score * weight),
        0
    );
    let percentage = availableWeight > 0 ? weightedScore / availableWeight : 0;
    
    // กฎการคัดกรองเพิ่มเติม: ถ้างบของทริปสูงกว่างบที่ผู้ใช้รับได้มากกว่า 2 เท่า
    // (เช่น งบคน 1,000 แต่ทริปราคา 2,500)
    if (userBudgetTHB !== null && tripBudgetTHB > userBudgetTHB * 2) {
        // จำกัดเพดานคะแนนความเข้ากันได้ให้ไม่เกิน 39%
        percentage = Math.min(percentage, 39);
    }
    
    // ปัดเศษเปอร์เซ็นต์ให้เป็นจำนวนเต็ม
    const tripTotal = Math.round(percentage);

    return {
        total: tripTotal,
        breakdown,
        tripMatch: tripTotal
    };
};



// Match Buddies (Find similar users)
export const findBuddy = async (req, res) => {
    try {
        const userId = req.user.userId;

        // 1. Get Current User
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, interests: true, travelStyle: true }
        });

        if (!currentUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // 2. Get users already swiped (liked)
        const swipedMatches = await prisma.userMatch.findMany({
            where: { likerId: userId, status: 'like' },
            select: { likedId: true }
        });
        const swipedIds = swipedMatches.map(m => m.likedId);

        // 3. Get All Other Users (Exclude self and swiped)
        const users = await prisma.user.findMany({
            where: {
                id: {
                    notIn: [userId, ...swipedIds]
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                profileImage: true,
                gallery: true,
                interests: true,
                bio: true,
                gender: true,
                age: true,
                travelStyle: true
            }
        });

        // 4. Calculate Similarity using exact 4-step logic
        const matches = users.map(user => {
            const similarityScore = calculateDetailedCompatibility(currentUser, user);
            return {
                ...user,
                matchScore: similarityScore
            };
        })
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 20); // Top 20

        res.json({ matches });

    } catch (error) {
        console.error('Find Buddy Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Match Trips (Find trips matching user style)
export const matchTrips = async (req, res) => {
    try {
        const userId = req.user.userId;

        // 1. Get Current User
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, interests: true, travelStyle: true }
        });

        if (!currentUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // 2. Get Active Trips
        const trips = await prisma.trip.findMany({
            where: {
                endDate: { gte: new Date() } // Only future/ongoing trips
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        profileImage: true,
                        interests: true,
                        travelStyle: true
                    },
                },
                participants: {
                    select: {
                        id: true,
                        userId: true,
                        name: true,
                        interests: true,
                        joinedAt: true,
                        status: true,
                    },
                },
            }
        });

        // 3. Calculate compatibility using exact 4-step logic
        const matches = trips.map(trip => {
            const result = calculateTripCompatibilityDetailed(currentUser, trip);
            return {
                ...trip,
                matchScore: result.total,
                matchBreakdown: result.breakdown
            };
        })
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 20);

        res.json({ matches });

    } catch (error) {
        console.error('Match Trips Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


// Like or Dislike a User
export const likeUser = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { targetId, status } = req.body; // status: "like" or "dislike"

        if (!targetId || !['like', 'dislike'].includes(status)) {
            return res.status(400).json({ error: 'Invalid request' });
        }

        // Check if mutual like exists
        let isMutual = false;
        if (status === 'like') {
            const oppositeLike = await prisma.userMatch.findFirst({
                where: {
                    likerId: targetId,
                    likedId: userId,
                    status: 'like'
                }
            });
            
            if (oppositeLike) {
                isMutual = true;
                
                // Update opposite to mutual
                await prisma.userMatch.update({
                    where: { id: oppositeLike.id },
                    data: { isMutual: true }
                });
                
                // Fetch users for notification
                const targetUser = await prisma.user.findUnique({ where: { id: targetId } });
                const currentUser = await prisma.user.findUnique({ where: { id: userId } });
                
                if (targetUser && currentUser) {
                    // Notify target user
                    await prisma.notification.create({
                        data: {
                            userId: targetId,
                            title: "It's a Match! 🎉",
                            message: `คุณและ ${currentUser.name} ใจตรงกัน! เริ่มทักทายกันได้เลย`,
                            type: "match",
                            relatedId: userId
                        }
                    });
                    
                    if (targetUser.fcmToken) {
                        await sendPushNotification(targetUser.fcmToken, "It's a Match! 🎉", `คุณและ ${currentUser.name} ใจตรงกัน! เริ่มทักทายกันได้เลย`, {
                            type: 'match',
                            targetId: userId
                        });
                    }

                    // Notify current user
                    await prisma.notification.create({
                        data: {
                            userId: userId,
                            title: "It's a Match! 🎉",
                            message: `คุณและ ${targetUser.name} ใจตรงกัน! เริ่มทักทายกันได้เลย`,
                            type: "match",
                            relatedId: targetId
                        }
                    });
                    
                    if (currentUser.fcmToken) {
                        await sendPushNotification(currentUser.fcmToken, "It's a Match! 🎉", `คุณและ ${targetUser.name} ใจตรงกัน! เริ่มทักทายกันได้เลย`, {
                            type: 'match',
                            targetId: targetId
                        });
                    }
                }
            }
        }

        // Create or update match for current user
        const match = await prisma.userMatch.upsert({
            where: {
                likerId_likedId: {
                    likerId: userId,
                    likedId: targetId
                }
            },
            update: { status, isMutual },
            create: {
                likerId: userId,
                likedId: targetId,
                status,
                isMutual
            }
        });

        res.json({ success: true, isMutual, match });

    } catch (error) {
        console.error('Like User Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Get Mutual Matches (People you can chat with)
export const getMutualMatches = async (req, res) => {
    try {
        const userId = req.user.userId;

        const matches = await prisma.userMatch.findMany({
            where: {
                OR: [
                    { likerId: userId, isMutual: true },
                    { likedId: userId, isMutual: true }
                ]
            }
        });

        const otherUserIds = matches.map(m => m.likerId === userId ? m.likedId : m.likerId);

        const users = await prisma.user.findMany({
            where: { id: { in: otherUserIds } },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                profileImage: true,
                gallery: true,
                interests: true,
                isVerified: true
            }
        });

        res.json({ matches: users });

    } catch (error) {
        console.error('Get Mutual Matches Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
