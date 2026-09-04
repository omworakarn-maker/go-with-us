import SwiftUI

struct TripCardView: View {
    let trip: Trip

    private var tripStyles: [String] {
        var styles = [trip.category.rawValue]
        for style in trip.interestTags where !styles.contains(style) {
            styles.append(style)
        }
        return Array(styles.prefix(3))
    }
    
    // Extract #hashtags from description
    private var tags: [String] {
        guard let desc = trip.description else { return [] }
        let words = desc.components(separatedBy: .whitespacesAndNewlines)
        return words.filter { $0.hasPrefix("#") && $0.count > 1 }
            .map { String($0.dropFirst()) }
            .prefix(3).map { $0 } // Max 3 tags on card
    }
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Image
            ZStack(alignment: .top) {
                if let imageUrl = trip.imageUrl, !imageUrl.isEmpty {
                    CustomAsyncImage(url: imageUrl, contentMode: .fill)
                        .frame(height: 200)
                        .clipped()
                } else {
                    Image("sosuke")
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .frame(height: 200)
                        .clipped()
                }
                
                HStack(alignment: .top) {
                    if let score = trip.matchScore {
                        Text(SettingsManager.shared.currentLanguage == .thai ? "เข้ากันได้ \(score)%" : "\(score)% Match")
                            .font(.system(size: 10, weight: .heavy))
                            .foregroundColor(.white)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(
                                LinearGradient(colors: [Color(hex: "#10B981"), Color(hex: "#34D399")], startPoint: .leading, endPoint: .trailing)
                            )
                            .cornerRadius(20)
                            .shadow(color: .black.opacity(0.15), radius: 4, x: 0, y: 2)
                    }
                    
                    Spacer()
                    
                    // Category Badge
                    HStack(spacing: 5) {
                        Text(trip.category.icon)
                            .font(.system(size: 13))
                        Text(trip.category.rawValue)
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.black)
                    }
                    .padding(.horizontal, 11)
                    .padding(.vertical, 6)
                    .background(Color.white.opacity(0.94))
                    .cornerRadius(20)
                    .shadow(color: .black.opacity(0.10), radius: 3, x: 0, y: 1)
                }
                .padding(12)
            }
            
            // Content
            VStack(alignment: .leading, spacing: 12) {
                // Title
                Text(trip.title)
                    .font(.system(size: 18, weight: .black, design: .rounded))
                    .foregroundColor(.adaptiveText)
                    .tracking(-0.5)
                    .lineLimit(2)
                
                // Destination
                HStack(spacing: 5) {
                    Image(systemName: "mappin.circle.fill")
                        .font(.system(size: 11))
                        .foregroundColor(.red)
                    
                    Text(trip.destination)
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(.adaptiveSecondaryText)
                }
                
                // Date Range
                Text(trip.formattedDateRange)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.gray)

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 7) {
                        ForEach(tripStyles, id: \.self) { style in
                            let icon = INTEREST_CATEGORIES.first(where: { $0.label == style })?.icon ?? "✈️"
                            HStack(spacing: 4) {
                                Text(icon)
                                Text(style)
                            }
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.adaptiveText)
                            .padding(.horizontal, 9)
                            .padding(.vertical, 5)
                            .background(Color.gray.opacity(0.09))
                            .clipShape(Capsule())
                        }
                    }
                }
                
                Divider()
                    .background(Color.gray.opacity(0.2))
                
                // Bottom Info
                HStack {
                    // Participants
                    HStack(spacing: 4) {
                        Circle()
                            .stroke(Color.appAccent, lineWidth: 1.5)
                            .frame(width: 20, height: 20)
                            .overlay(
                                Text("\(trip.currentParticipants)")
                                    .font(.system(size: 9, weight: .bold))
                                    .foregroundColor(.appAccent)
                            )
                        
                        Text("/\(trip.maxParticipants)")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.gray)
                    }
                    
                    Spacer()
                    
                    // Creator
                    HStack(spacing: 6) {
                        UserAvatarView(user: trip.creator, size: 24)
                        
                        Text(trip.creator.name)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(.adaptiveText)
                            .lineLimit(1)
                        
                        if trip.creator.isVerified == true {
                            Image(systemName: "checkmark.seal.fill")
                                .font(.system(size: 10))
                                .foregroundColor(Color(hex: "#3B82F6"))
                        }
                    }
                }

                // Hashtags belong to the content and stay at the bottom of the card.
                if !tags.isEmpty {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 7) {
                            ForEach(tags, id: \.self) { tag in
                                Text("#\(tag)")
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundColor(.appPrimary)
                                    .padding(.horizontal, 9)
                                    .padding(.vertical, 5)
                                    .background(Color.appPrimary.opacity(0.10))
                                    .clipShape(Capsule())
                            }
                        }
                    }
                }
            }
            .padding(16)
        }
        .background(Color.adaptiveCardBackground)
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(Color.gray.opacity(0.1), lineWidth: 1)
        )
        .cornerRadius(20)
        .shadow(color: Color.black.opacity(0.04), radius: 10, x: 0, y: 4)
        .grayscale(trip.isExpired ? 1.0 : 0.0)
        .opacity(trip.isExpired ? 0.6 : 1.0)
    }
}

#Preview {
    TripCardView(trip: Trip(
        id: "1",
        title: "เที่ยวเชียงใหม่ 3 วัน 2 คืน",
        destination: "เชียงใหม่",
        description: "ทริปสุดชิล",
        startDate: Date(),
        endDate: Date().addingTimeInterval(86400 * 2),
        budget: 5000,
        maxParticipants: 10,
        category: .adventure,
        creator: User(id: "1", name: "John", email: "john@example.com", role: .user),
        participants: []
    ))
    .padding()
}
