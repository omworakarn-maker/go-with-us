import Foundation

enum AIError: LocalizedError {
    case invalidURL
    case invalidAPIKey
    case noData
    case decodingError
    
    var errorDescription: String? {
        switch self {
        case .invalidURL: return "URL มีปัญหา"
        case .invalidAPIKey: return "API Key ไม่ถูกต้อง"
        case .noData: return "เซิร์ฟเวอร์ AI มีปัญหา กรุณาลองใหม่"
        case .decodingError: return "ข้อมูลที่ตอบกลับผิดพลาด"
        }
    }
}

class GeminiService {
    static let shared = GeminiService()
    
    // ✅ NO MORE HARDCODED API KEY!
    // The key is now stored securely on the backend.
    // iOS app calls our own backend proxy instead.
    
    private init() {}
    
    func chat(message: String, history: [ChatMessage], responseJSON: Bool = false) async throws -> String {
        var contents: [GeminiContent] = []
        let currentDate = Date().formatted(.iso8601.year().month().day())
        
        let systemPrompt = """
        คุณคือ 'ที่ปรึกษา' ผู้เชี่ยวชาญด้านการท่องเที่ยว หน้าที่ของคุณคือช่วยหาทริปเที่ยว ให้คำแนะนำสถานที่ท่องเที่ยว และร่างแผนการเดินทาง (Itinerary)
        
        กฎสำคัญเด็ดขาด:
        1. ห้ามตอบคำถามที่ไม่เกี่ยวข้องกับการท่องเที่ยว
        2. ถ้าผู้ใช้ขอให้ร่างทริป ให้จัดทำแผนการเดินทางรายวันละเอียดที่สุด และใส่ลงใน "itinerary" array (ห้ามใส่ใน description) โดย description ให้เขียนแค่สรุปย่อๆ ของทริปเท่านั้น **สำคัญมาก: คำบรรยายใน description และ title ต้องเขียนในมุมมองของผู้ใช้ที่เป็นคนจัดทริปเอง (เช่น ใช้คำว่า เรา/ฉัน/ผม หรือเชิญชวนเพื่อนๆ) ห้ามเขียนในมุมมองของ AI หรือผู้ช่วยจัดทริปเด็ดขาด**
        3. วันนี้คือ \(currentDate) หากผู้ใช้ไม่ได้ระบุวันที่ ให้เสนอวันที่ในอนาคต รูปแบบ YYYY-MM-DD เท่านั้น ห้ามเดาวันที่ย้อนหลัง
        4. สไตล์การเที่ยว (category) ต้องเลือกจากรายการนี้เท่านั้น: ทะเล, ภูเขา, แคมป์ปิ้ง, เที่ยวเมือง, คาเฟ่, อาหาร, แฮงเอาต์, ถ่ายรูป, ช้อปปิ้ง, คอนเสิร์ต, ผจญภัย, ไหว้พระ ห้ามสร้างหมวดหมู่ใหม่และห้ามใช้คำว่าอื่นๆ
        5. ถ้าทริปมี N วัน itinerary ต้องมี N รายการพอดี เรียง day ตั้งแต่ 1 ถึง N ห้ามขาดวัน ห้ามเพิ่มวัน และทุกวันต้องมีกิจกรรม
        6. เวลาในแต่ละวันต้องเรียงจากเช้าไปค่ำ ไม่ซ้อนกัน เผื่อเวลาเดินทาง พัก และรับประทานอาหารอย่างสมเหตุสมผล สถานที่ในวันเดียวกันควรอยู่บริเวณใกล้กัน
        7. วันแรกต้องคำนึงถึงเวลาเดินทางไปถึงและเช็กอิน วันสุดท้ายต้องคำนึงถึงการเช็กเอาต์และเดินทางกลับ
        8. งบประมาณ จำนวนคน หมวดหมู่ และช่วงเวลาต้องสอดคล้องกับแผน ห้ามใส่สถานที่หรือรายละเอียดเฉพาะที่ไม่มั่นใจว่าเป็นข้อมูลจริง
        9. เมื่อผู้ใช้ขอร่างทริป ให้ตอบ JSON เพียงก้อนเดียว ห้าม Markdown ห้ามข้อความนำหรือข้อความตามท้าย
        
        โครงสร้าง JSON สำหรับร่างทริป:
        {
          "title": "ชื่อทริป",
          "destination": "จังหวัดในประเทศไทย",
          "description": "คำอธิบายภาพรวมของทริปสั้นๆ (ไม่เกิน 2-3 ประโยค)",
          "startDate": "2026-XX-XX",
          "endDate": "2026-XX-XX",
          "budget": 500,
          "maxParticipants": 10,
          "category": "สไตล์ภาษาไทยจากรายการข้อ 4",
          "interestTags": ["ความชอบเพิ่มเติมไม่เกิน 2 รายการและห้ามซ้ำ category"],
          "activityStyle": 5,
          "timeOfDay": ["morning", "noon"],
          "tags": ["tag1", "tag2"],
          "itinerary": [
            {
              "day": 1,
              "activities": [
                {
                  "time": "09:00",
                  "name": "ชื่อสถานที่/กิจกรรม",
                  "location": "สถานที่",
                  "description": "รายละเอียดกิจกรรม"
                }
              ]
            }
          ]
        }
        """
        
        contents.append(GeminiContent(role: "user", parts: [GeminiPart(text: systemPrompt)]))
        contents.append(GeminiContent(role: "model", parts: [GeminiPart(text: "รับทราบครับ พร้อมช่วยจัดทริปครับ")]))
        
        for msg in history {
            contents.append(GeminiContent(
                role: msg.isUser ? "user" : "model",
                parts: [GeminiPart(text: msg.content)]
            ))
        }
        
        contents.append(GeminiContent(
            role: "user",
            parts: [GeminiPart(text: message)]
        ))
        
        let requestBody = GeminiChatRequest(
            contents: contents,
            generationConfig: responseJSON ? GeminiGenerationConfig(
                responseMimeType: "application/json",
                temperature: 0.35,
                maxOutputTokens: 8192
            ) : nil
        )
        
        do {
            let response: GeminiResponse = try await APIService.shared.request(
                endpoint: "/ai/chat",
                method: .post,
                body: requestBody,
                requiresAuth: true
            )
            
            return response.candidates?.first?.content.parts.first?.text ?? "ขออภัยครับ ลองใหม่อีกครั้ง"
        } catch {
            print("❌ Proxy AI Error: \(error.localizedDescription)")
            throw AIError.noData
        }
    }
}

// MARK: - Models
struct GeminiChatRequest: Codable {
    let contents: [GeminiContent]
    let generationConfig: GeminiGenerationConfig?
}

struct GeminiGenerationConfig: Codable {
    let responseMimeType: String
    let temperature: Double
    let maxOutputTokens: Int
}

struct GeminiContent: Codable {
    let role: String
    let parts: [GeminiPart]
}

struct GeminiPart: Codable {
    let text: String
}

struct GeminiResponse: Codable {
    let candidates: [Candidate]?
}
struct Candidate: Codable {
    let content: Content
}
struct Content: Codable {
    let parts: [Part]
}
struct Part: Codable {
    let text: String?
}

struct ChatMessage: Identifiable, Equatable, Codable {
    let id: UUID
    let content: String
    let isUser: Bool
    let timestamp: Date
    
    init(id: UUID = UUID(), content: String, isUser: Bool, timestamp: Date = Date()) {
        self.id = id
        self.content = content
        self.isUser = isUser
        self.timestamp = timestamp
    }
}
