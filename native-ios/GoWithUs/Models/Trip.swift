import Foundation

// MARK: - Trip Model
struct Trip: Codable, Identifiable, Hashable {
    let id: String
    let title: String
    let destination: String
    let description: String?
    let startDate: Date
    let endDate: Date?
    let budget: Int
    let budgetType: String?
    let maxParticipants: Int
    let category: TripCategory
    let interestTags: [String]
    let isPublic: Bool
    let imageUrl: String?
    let gallery: [String]?
    let creatorId: String
    let creator: User
    let participants: [Participant]?
    let itinerary: [DayPlan]?
    let activityStyle: Int?
    let timeOfDay: [String]?
    let aiAnalysis: AIAnalysis?
    let matchScore: Int?
    let matchBreakdown: MatchBreakdown?
    let createdAt: Date?
    let updatedAt: Date?
    
    var budgetTypeLabel: String {
        return (budgetType == "per_trip") ? "ต่อทริป" : "ต่อคน"
    }
    
    init(
        id: String,
        title: String,
        destination: String,
        description: String? = nil,
        startDate: Date,
        endDate: Date? = nil,
        budget: Int,
        budgetType: String? = "per_person",
        maxParticipants: Int,
        category: TripCategory,
        interestTags: [String] = [],
        isPublic: Bool = true,
        imageUrl: String? = nil,
        gallery: [String]? = nil,
        creator: User,
        participants: [Participant]? = nil,
        itinerary: [DayPlan]? = nil,
        activityStyle: Int? = nil,
        timeOfDay: [String]? = nil,
        creatorId: String? = nil,
        aiAnalysis: AIAnalysis? = nil,
        matchScore: Int? = nil,
        matchBreakdown: MatchBreakdown? = nil,
        createdAt: Date? = nil,
        updatedAt: Date? = nil
    ) {
        self.id = id
        self.title = title
        self.destination = destination
        self.description = description
        self.startDate = startDate
        self.endDate = endDate
        self.budget = budget
        self.budgetType = budgetType
        self.maxParticipants = maxParticipants
        self.category = category
        self.interestTags = interestTags
        self.isPublic = isPublic
        self.imageUrl = imageUrl
        self.gallery = gallery
        self.creator = creator
        self.participants = participants
        self.itinerary = itinerary
        self.activityStyle = activityStyle
        self.timeOfDay = timeOfDay
        self.creatorId = creatorId ?? creator.id
        self.aiAnalysis = aiAnalysis
        self.matchScore = matchScore
        self.matchBreakdown = matchBreakdown
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
    
    enum CodingKeys: String, CodingKey {
        case id, title, destination, description, startDate, endDate, budget, budgetType, maxParticipants, category, interestTags, isPublic, imageUrl, gallery, creatorId, creator, participants, itinerary, activityStyle, timeOfDay, aiAnalysis, matchScore, matchBreakdown, createdAt, updatedAt
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        title = try container.decode(String.self, forKey: .title)
        destination = try container.decode(String.self, forKey: .destination)
        description = try container.decodeIfPresent(String.self, forKey: .description)
        startDate = try container.decode(Date.self, forKey: .startDate)
        endDate = try container.decodeIfPresent(Date.self, forKey: .endDate)
        budget = try container.decode(Int.self, forKey: .budget)
        budgetType = try container.decodeIfPresent(String.self, forKey: .budgetType)
        maxParticipants = try container.decode(Int.self, forKey: .maxParticipants)
        category = try container.decode(TripCategory.self, forKey: .category)
        interestTags = try container.decodeIfPresent([String].self, forKey: .interestTags) ?? []
        isPublic = try container.decodeIfPresent(Bool.self, forKey: .isPublic) ?? true
        imageUrl = try container.decodeIfPresent(String.self, forKey: .imageUrl)
        gallery = try container.decodeIfPresent([String].self, forKey: .gallery)
        creatorId = try container.decode(String.self, forKey: .creatorId)
        creator = try container.decode(User.self, forKey: .creator)
        participants = try container.decodeIfPresent([Participant].self, forKey: .participants)
        itinerary = try container.decodeIfPresent([DayPlan].self, forKey: .itinerary)
        activityStyle = try container.decodeIfPresent(Int.self, forKey: .activityStyle)
        timeOfDay = try container.decodeIfPresent([String].self, forKey: .timeOfDay)
        aiAnalysis = try container.decodeIfPresent(AIAnalysis.self, forKey: .aiAnalysis)
        matchScore = try container.decodeIfPresent(Int.self, forKey: .matchScore)
        matchBreakdown = try container.decodeIfPresent(MatchBreakdown.self, forKey: .matchBreakdown)
        createdAt = try container.decodeIfPresent(Date.self, forKey: .createdAt)
        updatedAt = try container.decodeIfPresent(Date.self, forKey: .updatedAt)
    }
    
    var currentParticipants: Int {
        participants?.count ?? 0
    }
    
    var isFull: Bool {
        currentParticipants >= maxParticipants
    }
    
    var isExpired: Bool {
        // A date-only trip remains active for the whole calendar day.
        let lastTripDay = endDate ?? startDate
        return lastTripDay < Calendar.current.startOfDay(for: Date())
    }
    
    var formattedDateRange: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "d MMM"
        formatter.locale = Locale(identifier: SettingsManager.shared.currentLanguage == .thai ? "th_TH" : "en_US")
        if let endDate = endDate {
            return "\(formatter.string(from: startDate)) - \(formatter.string(from: endDate))"
        } else {
            return formatter.string(from: startDate)
        }
    }
    
    var formattedBudget: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        return "฿\(formatter.string(from: NSNumber(value: budget)) ?? "\(budget)")"
    }
}

// MARK: - Trip Category (Simplified temporarily to fix build)
enum TripCategory: String, Codable, CaseIterable {
    case beach = "ทะเล"
    case mountain = "ภูเขา"
    case camping = "แคมป์ปิ้ง"
    case city = "เที่ยวเมือง"
    case cafe = "คาเฟ่"
    case food = "อาหาร"
    case hangout = "แฮงเอาต์"
    case photography = "ถ่ายรูป"
    case shopping = "ช้อปปิ้ง"
    case concert = "คอนเสิร์ต"
    case adventure = "ผจญภัย"
    case temple = "ไหว้พระ"
    case other = "อื่นๆ"
    
    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        let rawValue = try container.decode(String.self)
        self = TripCategory(rawValue: rawValue) ?? .other
    }
    
    var icon: String {
        switch self {
        case .beach: return "🏖️"
        case .mountain: return "🏔️"
        case .camping: return "🏕️"
        case .city: return "🏙️"
        case .cafe: return "☕️"
        case .food: return "🍜"
        case .hangout: return "🍻"
        case .photography: return "📸"
        case .shopping: return "🛍️"
        case .concert: return "🎫"
        case .adventure: return "🧗"
        case .temple: return "🏛️"
        case .other: return "📌"
        }
    }
}

// MARK: - AI Analysis
struct AIAnalysis: Codable, Hashable {
    let summary: String
    let highlights: [String]
    let recommendations: [String]
    let compatibility: Int?
}

// MARK: - Itinerary
struct DayPlan: Codable, Identifiable, Hashable {
    var id = UUID()
    var day: Int
    var activities: [Activity]
    
    enum CodingKeys: String, CodingKey {
        case day, activities
    }
}

struct Activity: Codable, Identifiable, Hashable {
    var id = UUID()
    var time: String
    var name: String
    var location: String
    var description: String
    
    enum CodingKeys: String, CodingKey {
        case time, name, location, description
    }
}

// MARK: - Match Breakdown
struct MatchBreakdown: Codable, Hashable {
    let budget: Int?
    let activityStyle: Int?
    let category: Int?
    let timeOfDay: Int?
    let groupMatch: Int?
}
