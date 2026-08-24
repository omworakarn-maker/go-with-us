import Foundation

struct TripDraft: Codable {
    let title: String
    let destination: String
    let description: String
    let startDate: String // Format: YYYY-MM-DD
    let endDate: String?  // Format: YYYY-MM-DD
    let budget: Int
    let budgetType: String?
    let maxParticipants: Int
    let category: String
    let interestTags: [String]?
    let tags: [String]?
    let itinerary: [DayPlan]?
    let activityStyle: Int?
    let timeOfDay: [String]?
}
