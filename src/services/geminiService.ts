import { GoogleGenerativeAI } from "@google/generative-ai";
import { Trip, AIRecommendation } from "../types";

// Get API key from environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize AI with API key if available
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export const analyzeTripPlan = async (trip: Trip): Promise<AIRecommendation> => {
  // Check if AI is initialized
  if (!genAI) {
    throw new Error('Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in .env.local');
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = `
    ในบทบาทของคุณที่เป็นผู้เชี่ยวชาญด้านการจัดทริปท่องเที่ยวภายในประเทศไทย จงวิเคราะห์กิจกรรมกลุ่มนี้และเสนอแผนการเดินทางที่ออกแบบมาโดยเฉพาะตามความสนใจของสมาชิกทุกคน

    ข้อมูลทริป:
    ชื่อทริป: ${trip.title}
    จุดหมายในไทย: ${trip.destination}
    ระยะเวลา: ${trip.startDate} ถึง ${trip.endDate}
    งบประมาณ: ${trip.budget}
    สมาชิกในกลุ่ม: ${JSON.stringify(trip.participants)}
    
    ข้อกำหนด:
    1. แผนการเดินทางต้องเป็นภาษาไทยทั้งหมด และแนะนำสถานที่ที่อยู่ในประเทศไทยเท่านั้น
    2. ออกแบบให้มีความเรียบหรู แต่ยังคงความมินิมอล (Luxury Minimalist)
    3. เน้นความลงตัวของกลุ่ม (Group Harmony) และประสบการณ์คุณภาพสูง
    4. คำสรุป (Summary) ต้องมีความสละสลวยและสร้างแรงบันดาลใจให้คนอยากไปเที่ยวเมืองไทย
    5. ตอบกลับเป็น JSON เท่านั้น
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  let text = response.text();

  // Clean JSON string
  text = text.replace(/```json/g, '').replace(/```/g, '').trim();

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to parse AI response", error);
    throw new Error("Could not generate Thai trip analysis.");
  }
};

// Interface for AI's proposed trip
interface ProposedTrip {
  title: string;
  destination: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  budget: string;    // Budget, Moderate, Luxury
  category: string;
}

export const exploreTrips = async (
  query: string,
  availableTrips: any[],
  userProfile?: { name: string; interests: string[] }
): Promise<{ answer: string; suggestedTripIds: string[]; proposedTrip?: ProposedTrip | null }> => {
  try {
    if (!genAI) {
      throw new Error('Gemini API is not configured.');
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const tripsContext = availableTrips
      .map(
        (t) =>
          `ID: ${t.id} | Title: ${t.title} | Destination: ${t.destination} | Category: ${t.category} | Date: ${t.startDate} | Desc: ${(t.description || "").substring(0, 100)}...`
      )
      .join("\n");

    const userContext = userProfile
      ? `User Name: ${userProfile.name}
         User Interests: ${userProfile.interests.join(", ") || "General user, no specific interests set."}`
      : "User: Guest (Unknown interests)";

    const today = new Date().toISOString().split('T')[0];

    const prompt = `
      You are an AI Trip Creator for "GoWithUs".
      TODAY'S DATE: ${today}

      CONTEXT:
      ${userContext}
      
      AVAILABLE TRIPS (DB):
      ${tripsContext}

      USER QUESTION: "${query}"

      INSTRUCTIONS:
      1. Answer in Thai (Friendly & Enthusiastic).
      2. **SEARCH**: Check "AVAILABLE TRIPS". If matches found, list in 'suggestedTripIds'.
      3. **CREATE RULE**: 
         - If the user says "create", "plan", "want to go to...", "trip to..." (e.g. "อยากไปญี่ปุ่น", "จัดทริปภูเก็ต").
         - AND/OR if NO matching trips found in database.
         - **YOU MUST GENERATE a 'proposedTrip' object.** Do not just give advice.
      4. 'proposedTrip' Details:
         - 'startDate': Future date (e.g. next month).
         - 'budget': Guess based on destination (e.g. Japan = Luxury, Camping = Budget).
      5. If creating, your 'answer' must say: "ผมร่างทริปให้แล้วครับ ลองดูด้านล่างนะ! 👇"

      FORMAT (JSON ONLY):
      {
        "answer": "Text response...",
        "suggestedTripIds": ["id1"],
        "proposedTrip": {
           "title": "ทริป...",
           "destination": "...",
           "description": "...",
           "startDate": "YYYY-MM-DD",
           "endDate": "YYYY-MM-DD",
           "budget": "Moderate",
           "category": "Travel"
        } OR null
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean JSON string
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    if (!text) throw new Error("No response from AI");

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid JSON format from AI");
    }

    return JSON.parse(jsonMatch[0]);
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Explore AI Error:", error);

    // --- MOCK FALLBACK (เมื่อ AI พัง/Token หมด ให้ตอบแบบจำลองแทน) ---
    console.log("⚠️ Switching to MOCK mode due to API Error");

    const mockProposedTrip: ProposedTrip = {
      title: "ทริปเชียงใหม่ สัมผัสอากาศหนาว",
      destination: "เชียงใหม่",
      description: "สัมผัสบรรยากาศดอยอินทนนท์ ชมดอกนางพญาเสือโคร่ง และไหว้พระธาตุดอยสุเทพ ทริป 3 วัน 2 คืน พักผ่อนท่ามกลางธรรมชาติ",
      startDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0], // Next week
      endDate: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
      budget: "Moderate",
      category: "Nature"
    };

    return {
      answer: "ตอนนี้ AI ตัวจริงพักผ่อนอยู่ครับ (Token หมด/Error) 😅\nแต่ไม่ต้องห่วง! ผมจำลอง **ทริปตัวอย่าง** มาให้คุณลองกดเล่นดูนะครับ 👇",
      suggestedTripIds: availableTrips.slice(0, 2).map(t => t.id), // แนะนำทริปที่มีอยู่มั่วๆ 2 อัน
      proposedTrip: query.includes("สร้าง") || query.includes("ทริป") ? mockProposedTrip : undefined
    };
  }
};
