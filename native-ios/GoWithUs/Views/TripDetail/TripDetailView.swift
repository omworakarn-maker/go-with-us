import SwiftUI

struct TripDetailView: View {
    let tripId: String
    let autoShowJoin: Bool
    @StateObject private var viewModel: TripDetailViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var showDeleteAlert = false
    @State private var showEditSheet = false
    @State private var selectedImage: ImageViewerItem? = nil
    @State private var kickParticipantId: String? = nil
    @State private var kickParticipantName: String = ""
    @State private var showInterestedSheet = false
    @State private var showMapOptions = false
    @State private var mapLocationToOpen = ""
    
    struct ImageViewerItem: Identifiable {
        let id = UUID()
        let urls: [String]
        let initialIndex: Int
    }
    
    init(tripId: String, autoShowJoin: Bool = false) {
        self.tripId = tripId
        self.autoShowJoin = autoShowJoin
        _viewModel = StateObject(wrappedValue: TripDetailViewModel(tripId: tripId))
    }
    
    private func extractTags(from description: String?) -> [String] {
        guard let desc = description else { return [] }
        return desc.components(separatedBy: .whitespacesAndNewlines)
            .filter { $0.hasPrefix("#") && $0.count > 1 }
            .map { String($0.dropFirst()) }
    }
    
    private func formatBudget(_ value: Int) -> String {
        let f = NumberFormatter()
        f.numberStyle = .decimal
        f.groupingSeparator = ","
        return f.string(from: NSNumber(value: value)) ?? "\(value)"
    }
    
    var body: some View {
        ZStack {
            Color.adaptiveBackground.ignoresSafeArea()
            
            if viewModel.isLoading && viewModel.trip == nil {
                VStack(spacing: 12) {
                    ProgressView().tint(.appPrimary).scaleEffect(1.2)
                    Text("กำลังโหลด…")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(.adaptiveSecondaryText)
                }
            } else if let trip = viewModel.trip {
                ScrollView(showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 0) {
                        // ══════════════════════════════════════════════
                        // ▸ HERO IMAGE
                        // ══════════════════════════════════════════════
                        heroImage(trip: trip)
                        
                        // ══════════════════════════════════════════════
                        // ▸ TITLE + DESTINATION (below image)
                        // ══════════════════════════════════════════════
                        titleBelowImage(trip: trip)
                        
                        // ══════════════════════════════════════════════
                        // ▸ CONTENT
                        // ══════════════════════════════════════════════
                        VStack(alignment: .leading, spacing: 22) {
                            badgesRow(trip: trip)
                            infoCards(trip: trip)
                            
                            if let score = trip.matchScore {
                                softDivider()
                                compatibilitySection(trip: trip, score: score)
                            }
                            
                            softDivider()
                            creatorSection(trip: trip)
                            
                            softDivider()
                            descriptionSection(trip: trip)
                            tagsSection(trip: trip)
                            
                            itinerarySection(trip: trip)
                            
                            gallerySection(trip: trip)
                            participantsSection(trip: trip)
                        }
                        .padding(.horizontal, 22)
                        .padding(.top, 22)
                        .padding(.bottom, 200)
                    }
                }
                .refreshable {
                    await viewModel.loadTrip()
                }
                
                // ══════════════════════════════════════════════
                // ▸ FLOATING ACTION BAR
                // ══════════════════════════════════════════════
                VStack(spacing: 0) {
                    Spacer()
                    actionBar(trip: trip)
                }
                .ignoresSafeArea(edges: .bottom)
            }
            
            // ══════════════════════════════════════════════
            // ▸ BACK BUTTON (floating, safe area correct)
            // ══════════════════════════════════════════════
            VStack {
                HStack {
                    Button { dismiss() } label: {
                        Image(systemName: "arrow.left")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(.white)
                            .padding(11)
                            .background(.ultraThinMaterial.opacity(0.6))
                            .background(Color.black.opacity(0.25))
                            .clipShape(Circle())
                    }
                    
                    Spacer()
                    
                    if viewModel.isCreator || viewModel.isAdmin {
                        Button { showEditSheet = true } label: {
                            Image(systemName: "pencil")
                                .font(.system(size: 15, weight: .bold))
                                .foregroundColor(.white)
                                .padding(11)
                                .background(.ultraThinMaterial.opacity(0.6))
                                .background(Color.black.opacity(0.25))
                                .clipShape(Circle())
                        }
                    }
                    
                    if viewModel.hasJoined, let trip = viewModel.trip {
                        NavigationLink(destination: ChatDetailView(
                            chatTitle: trip.title, tripId: trip.id, partnerId: nil
                        )) {
                            Image(systemName: "bubble.left.fill")
                                .font(.system(size: 15, weight: .bold))
                                .foregroundColor(.white)
                                .padding(11)
                                .background(.ultraThinMaterial.opacity(0.6))
                                .background(Color.black.opacity(0.25))
                                .clipShape(Circle())
                        }
                    }
                }
                .padding(.horizontal, 18)
                .padding(.top, 10)
                
                Spacer()
            }
        }
        .navigationBarHidden(true)
        .hideTabBar(true)
        .onTapGesture { hideKeyboard() }
        .task {
            if viewModel.trip == nil {
                await viewModel.loadTrip() 
            }
            if autoShowJoin {
                viewModel.showJoinSheet = true
            }
        }
        .alert("ยืนยันการลบ", isPresented: $showDeleteAlert) {
            Button("ยกเลิก", role: .cancel) {}
            Button("ลบ", role: .destructive) {
                Task { if await viewModel.deleteTrip() { dismiss() } }
            }
        } message: { Text("คุณต้องการลบทริปนี้ใช่หรือไม่?") }
        .alert("เตะออกจากทริป", isPresented: Binding(
            get: { kickParticipantId != nil },
            set: { if !$0 { kickParticipantId = nil } }
        )) {
            Button("ยกเลิก", role: .cancel) { kickParticipantId = nil }
            Button("เตะ ออก", role: .destructive) {
                if let uid = kickParticipantId {
                    Task {
                        await viewModel.removeParticipant(userId: uid)
                        kickParticipantId = nil
                    }
                }
            }
        } message: {
            Text("ต้องการนำ \(kickParticipantName) ออกจากทริปนี้ใช่หรือไม่?")
        }
        .confirmationDialog("เลือกแอปแผนที่", isPresented: $showMapOptions, titleVisibility: .visible) {
            Button("Apple Maps") {
                openAppleMaps(location: mapLocationToOpen)
            }
            Button("Google Maps") {
                openGoogleMaps(location: mapLocationToOpen)
            }
            Button("ยกเลิก", role: .cancel) {}
        }
        .tint(.blue)
        .sheet(isPresented: $showInterestedSheet) {
            InterestTripSheet(viewModel: viewModel)
        }
        .sheet(isPresented: $showEditSheet, onDismiss: {
            Task {
                await viewModel.loadTrip()
            }
        }) {
            if let trip = viewModel.trip { CreateTripView(trip: trip) }
        }
        .sheet(isPresented: $viewModel.showLeaveSheet) { LeaveTripSheet(viewModel: viewModel) }
        .sheet(isPresented: $viewModel.showJoinSheet) { JoinTripSheet(viewModel: viewModel) }
        .fullScreenCover(item: $selectedImage) { item in
            ImageViewerView(urls: item.urls, initialIndex: item.initialIndex) {
                selectedImage = nil
            }
        }
    }
    
    // MARK: - Hero Image (รูปอย่างเดียว ไม่มี overlay ชื่อ)
    @ViewBuilder
    private func heroImage(trip: Trip) -> some View {
        let allImages: [String] = {
            var imgs = [String]()
            if let m = trip.imageUrl, !m.isEmpty { imgs.append(m) }
            if let g = trip.gallery { for i in g where !imgs.contains(i) { imgs.append(i) } }
            return imgs
        }()
        
        ZStack(alignment: .bottom) {
            if allImages.isEmpty {
                Image("sosuke")
                    .resizable().aspectRatio(contentMode: .fill)
                    .frame(maxWidth: .infinity).frame(height: 300).clipped()
            } else {
                TabView {
                    ForEach(Array(allImages.enumerated()), id: \.offset) { index, url in
                        CustomAsyncImage(url: url, contentMode: .fill)
                            .frame(width: UIScreen.main.bounds.width, height: 300).clipped()
                            .onTapGesture { 
                                selectedImage = ImageViewerItem(urls: allImages, initialIndex: index) 
                            }
                    }
                }
                .tabViewStyle(.page)
                .indexViewStyle(.page(backgroundDisplayMode: .always))
                .frame(width: UIScreen.main.bounds.width, height: 300)
            }
            
            // Gradient scrim (เบาลงเพราะไม่ต้องรองรับตัวอักษรแล้ว)
            LinearGradient(colors: [.clear, .black.opacity(0.35)],
                           startPoint: .center, endPoint: .bottom)
                .frame(height: 80)
        }
    }
    
    // MARK: - Title Below Image
    @ViewBuilder
    private func titleBelowImage(trip: Trip) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(trip.title)
                .font(.system(size: 28, weight: .black))
                .foregroundColor(.adaptiveText)
                .lineLimit(2)
            
            HStack(spacing: 4) {
                Image(systemName: "mappin.circle.fill")
                    .foregroundColor(.red)
                Text(trip.destination)
            }
            .font(.system(size: 15, weight: .bold))
            .foregroundColor(.adaptiveSecondaryText)
        }
        .padding(.horizontal, 22)
        .padding(.top, 18)
        .padding(.bottom, 4)
    }
    
    // MARK: - Badges
    @ViewBuilder
    private func badgesRow(trip: Trip) -> some View {
        HStack(spacing: 8) {
            // Category
            HStack(spacing: 5) {
                let iconName = INTEREST_CATEGORIES.first(where: { $0.id == trip.category.rawValue })?.icon ?? "✈️"
                Text(iconName).font(.system(size: 10, weight: .bold))
                Text(trip.category.rawValue).font(.system(size: 12, weight: .bold))
            }
            .foregroundColor(.white)
            .padding(.horizontal, 14).padding(.vertical, 7)
            .background(Color.black)
            .clipShape(Capsule())
            
            Spacer()
            
            // Status
            if trip.isFull {
                HStack(spacing: 4) {
                    Circle().fill(.red).frame(width: 6, height: 6)
                    Text("เต็มแล้ว").font(.system(size: 12, weight: .bold))
                }
                .foregroundColor(Color(hex: "#DC2626"))
                .padding(.horizontal, 14).padding(.vertical, 7)
                .background(Color(hex: "#FEE2E2"))
                .clipShape(Capsule())
            } else {
                HStack(spacing: 4) {
                    Circle().fill(Color(hex: "#22C55E")).frame(width: 6, height: 6)
                    Text("ว่าง \(trip.maxParticipants - trip.currentParticipants) คน")
                        .font(.system(size: 12, weight: .bold))
                }
                .foregroundColor(Color(hex: "#16A34A"))
                .padding(.horizontal, 14).padding(.vertical, 7)
                .background(Color(hex: "#DCFCE7"))
                .clipShape(Capsule())
            }
        }
    }
    
    // MARK: - Title + Meta
    @ViewBuilder
    private func titleSection(trip: Trip) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(trip.title)
                .font(.system(size: 26, weight: .black))
                .foregroundColor(.adaptiveText)
                .fixedSize(horizontal: false, vertical: true)
            
            HStack(spacing: 18) {
                HStack(spacing: 5) {
                    Image(systemName: "mappin.circle")
                        .foregroundColor(Color(hex: "#EF4444"))
                    Text(trip.destination)
                }
                HStack(spacing: 5) {
                    Image(systemName: "calendar")
                        .foregroundColor(Color(hex: "#3B82F6"))
                    Text(trip.formattedDateRange)
                }
            }
            .font(.system(size: 13, weight: .medium))
            .foregroundColor(.adaptiveSecondaryText)
        }
    }
    
    // MARK: - Compatibility Section
    @ViewBuilder
    private func compatibilitySection(trip: Trip, score: Int) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 8) {
                Image(systemName: "heart.fill")
                    .font(.system(size: 13))
                    .foregroundColor(Color(hex: "#10B981"))
                Text("ความเข้ากันของคุณ")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(.adaptiveText)
            }
            
            HStack(spacing: 20) {
                // Circular progress
                ZStack {
                    Circle()
                        .stroke(Color.gray.opacity(0.15), lineWidth: 8)
                        .frame(width: 90, height: 90)
                    Circle()
                        .trim(from: 0, to: CGFloat(score) / 100.0)
                        .stroke(
                            LinearGradient(colors: scoreGradientColors(score: score), startPoint: .topLeading, endPoint: .bottomTrailing),
                            style: StrokeStyle(lineWidth: 8, lineCap: .round)
                        )
                        .frame(width: 90, height: 90)
                        .rotationEffect(.degrees(-90))
                    
                    VStack(spacing: 2) {
                        Text("\(score)%")
                            .font(.system(size: 22, weight: .black))
                            .foregroundColor(scoreColor(score: score))
                        Text("แมตช์")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(.adaptiveSecondaryText)
                    }
                }
                
                // Factor list
                VStack(alignment: .leading, spacing: 14) {
                    let bd = trip.matchBreakdown
                    compatibilityRow(
                        icon: "banknote",
                        label: "งบประมาณ",
                        color: Color(hex: "#3B82F6"),
                        score: bd?.budget
                    )
                    compatibilityRow(icon: "list.number", label: "จำนวนกิจกรรมต่อวัน", color: Color(hex: "#8B5CF6"), score: bd?.activityStyle)
                    compatibilityRow(icon: "tag.fill", label: "ความชอบ", color: Color(hex: "#F59E0B"), score: bd?.category)
                    compatibilityRow(icon: "clock.fill", label: "ช่วงเวลา", color: Color(hex: "#EF4444"), score: bd?.timeOfDay)
                }

            }
            .padding(18)
            .background(Color.adaptiveCardBackground)
            .cornerRadius(20)
            .shadow(color: scoreColor(score: score).opacity(0.10), radius: 12, x: 0, y: 4)
            
            Text(scoreLabel(score: score))
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(.adaptiveSecondaryText)
                .padding(.horizontal, 4)
        }
    }
    
    @ViewBuilder
    private func compatibilityRow(icon: String, label: String, color: Color, score: Int?) -> some View {
        VStack(spacing: 6) {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(color)
                    .frame(width: 18)
                Text(label)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.adaptiveSecondaryText)
                
                Spacer(minLength: 8)
                
                if let s = score {
                    Text("\(s)%")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(scoreColor(score: s))
                } else {
                    Text("ไม่มีข้อมูล")
                        .font(.system(size: 10))
                        .foregroundColor(.gray.opacity(0.5))
                }
            }
            
            if let s = score {
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule().fill(Color.gray.opacity(0.15))
                            .frame(height: 4)
                        Capsule().fill(scoreColor(score: s))
                            .frame(width: geo.size.width * CGFloat(s) / 100.0, height: 4)
                    }
                }
                .frame(height: 4)
                .padding(.leading, 26)
            }
        }
    }
    
    private func scoreColor(score: Int) -> Color {
        switch score {
        case 75...100: return Color(hex: "#10B981") // Green
        case 50...74:  return Color(hex: "#3B82F6") // Blue
        case 25...49:  return Color(hex: "#F59E0B") // Orange
        default:       return Color(hex: "#EF4444") // Red
        }
    }
    
    private func scoreGradientColors(score: Int) -> [Color] {
        switch score {
        case 75...100: return [Color(hex: "#10B981"), Color(hex: "#34D399")]
        case 50...74:  return [Color(hex: "#3B82F6"), Color(hex: "#60A5FA")]
        case 25...49:  return [Color(hex: "#F59E0B"), Color(hex: "#FCD34D")]
        default:       return [Color(hex: "#EF4444"), Color(hex: "#F87171")]
        }
    }
    
    private func scoreLabel(score: Int) -> String {
        switch score {
        case 75...100: return "🎉 ไปได้แน่นอนไปกันรอด"
        case 50...74:  return "👍 โอเคไปกันได้"
        case 25...49:  return "🤔 ไม่ค่อยแนะนำ"
        default:       return "😅 เข้าไม่ได้"
        }
    }

    // MARK: - Info Cards
    @ViewBuilder
    private func infoCards(trip: Trip) -> some View {
        HStack(spacing: 12) {
            // Budget card
            VStack(spacing: 6) {
                ZStack {
                    Circle()
                        .fill(Color(hex: "#3B82F6").opacity(0.15))
                        .frame(width: 40, height: 40)
                    Image(systemName: "banknote")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(Color(hex: "#3B82F6"))
                }
                Text("งบประมาณ (\(trip.budgetTypeLabel))")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.adaptiveSecondaryText)
                Text("\(formatBudget(trip.budget)) ฿")
                    .font(.system(size: 15, weight: .black))
                    .foregroundColor(.adaptiveText)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 18)
            .background(Color.adaptiveCardBackground)
            .cornerRadius(18)
            
            // People card
            VStack(spacing: 6) {
                ZStack {
                    Circle()
                        .fill(Color(hex: "#F43F5E").opacity(0.15))
                        .frame(width: 40, height: 40)
                    Image(systemName: "person.2")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(Color(hex: "#F43F5E"))
                }
                Text("จำนวนคน")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.adaptiveSecondaryText)
                Text("\(trip.currentParticipants)/\(trip.maxParticipants)")
                    .font(.system(size: 15, weight: .black))
                    .foregroundColor(.adaptiveText)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 18)
            .background(Color.adaptiveCardBackground)
            .cornerRadius(18)

            // Dates card
            VStack(spacing: 6) {
                ZStack {
                    Circle()
                        .fill(Color(hex: "#8B5CF6").opacity(0.15))
                        .frame(width: 40, height: 40)
                    Image(systemName: "calendar")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(Color(hex: "#8B5CF6"))
                }
                Text("ระยะเวลา")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.adaptiveSecondaryText)
                Text(trip.formattedDateRange)
                    .font(.system(size: 15, weight: .black))
                    .foregroundColor(.adaptiveText)
                    .lineLimit(1)
                    .minimumScaleFactor(0.5)
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 18)
            .background(Color.adaptiveCardBackground)
            .cornerRadius(18)
        }
    }
    
    // MARK: - Creator Section
    @ViewBuilder
    private func creatorSection(trip: Trip) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 6) {
                Image(systemName: "crown.fill")
                    .font(.system(size: 13))
                    .foregroundColor(Color(hex: "#F59E0B"))
                Text("ผู้จัดทริป")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(.adaptiveText)
            }
            
            // Creator card — tappable for profile ✅
            NavigationLink(destination: UserProfileView(user: trip.creator)) {
                HStack(spacing: 14) {
                    // Avatar dynamically tracking self
                    UserAvatarView(user: trip.creator, size: 50)
                        .shadow(color: Color.appPrimary.opacity(0.2), radius: 6, x: 0, y: 3)
                    
                    VStack(alignment: .leading, spacing: 3) {
                        HStack(spacing: 4) {
                            Text(trip.creator.name)
                                .font(.system(size: 15, weight: .bold))
                                .foregroundColor(.adaptiveText)
                            
                            if trip.creator.isVerified == true {
                                Image(systemName: "checkmark.seal.fill")
                                    .font(.system(size: 11))
                                    .foregroundColor(.blue)
                            }
                        }
                        
                        if trip.creator.role == .admin {
                            Text("ADMIN")
                                .font(.system(size: 9, weight: .black))
                                .foregroundColor(.white)
                                .padding(.horizontal, 8).padding(.vertical, 2)
                                .background(Color.appPrimary)
                                .cornerRadius(4)
                        } else {
                            Text("ดูโปรไฟล์ →")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(.appPrimary)
                        }
                    }
                    
                    Spacer()
                    
                    Image(systemName: "chevron.right")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(.adaptiveSecondaryText.opacity(0.4))
                }
                .padding(14)
                .background(Color.adaptiveCardBackground)
                .cornerRadius(16)
                .shadow(color: .black.opacity(0.04), radius: 8, x: 0, y: 3)
            }
            
            // Chat with creator — separate button
            NavigationLink(destination: ChatDetailView(
                chatTitle: trip.creator.name, tripId: nil, partnerId: trip.creator.id
            )) {
                HStack(spacing: 8) {
                    Image(systemName: "paperplane.fill")
                        .font(.system(size: 13))
                    Text("ส่งข้อความถึงผู้จัด")
                        .font(.system(size: 13, weight: .semibold))
                }
                .foregroundColor(.appPrimary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 11)
                .background(Color.appPrimary.opacity(0.08))
                .cornerRadius(12)
            }
        }
    }
    
    // MARK: - Description
    @ViewBuilder
    private func descriptionSection(trip: Trip) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                Image(systemName: "doc.text") // Minimal
                    .font(.system(size: 13))
                    .foregroundColor(Color(hex: "#8B5CF6"))
                Text("รายละเอียด")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(.adaptiveText)
            }
            
            Text(trip.description ?? "ไม่มีรายละเอียด")
                .font(.system(size: 14))
                .foregroundColor(.adaptiveSecondaryText)
                .lineSpacing(5)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
    
    // MARK: - Tags
    @ViewBuilder
    private func tagsSection(trip: Trip) -> some View {
        let tags = extractTags(from: trip.description)
        if !tags.isEmpty {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(tags, id: \.self) { tag in
                        Text("#\(tag)")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundColor(.appPrimary)
                            .padding(.horizontal, 14).padding(.vertical, 7)
                            .background(Color.appPrimary.opacity(0.08))
                            .clipShape(Capsule())
                    }
                }
            }
        }
    }
    
    // MARK: - Itinerary
    @ViewBuilder
    private func itinerarySection(trip: Trip) -> some View {
        if let itinerary = trip.itinerary, !itinerary.isEmpty {
            softDivider()
            
            VStack(alignment: .leading, spacing: 16) {
                HStack(spacing: 6) {
                    Image(systemName: "list.bullet.clipboard")
                        .font(.system(size: 13))
                        .foregroundColor(Color(hex: "#10B981"))
                    Text("การเดินทางแต่ละวัน")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.adaptiveText)
                }
                
                VStack(alignment: .leading, spacing: 18) {
                    ForEach(itinerary.sorted(by: { $0.day < $1.day })) { dayPlan in
                        VStack(alignment: .leading, spacing: 10) {
                            Text("วันที่ \(dayPlan.day)")
                                .font(.system(size: 15, weight: .bold))
                                .foregroundColor(.appPrimary)
                                .padding(.horizontal, 10).padding(.vertical, 4)
                                .background(Color.appPrimary.opacity(0.1))
                                .cornerRadius(8)
                            
                            VStack(alignment: .leading, spacing: 12) {
                                ForEach(dayPlan.activities) { activity in
                                    HStack(alignment: .top, spacing: 12) {
                                        Text(activity.time)
                                            .font(.system(size: 13, weight: .bold))
                                            .foregroundColor(.adaptiveSecondaryText)
                                            .frame(width: 45, alignment: .leading)
                                        
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text(activity.name)
                                                .font(.system(size: 14, weight: .bold))
                                                .foregroundColor(.adaptiveText)
                                            
                                            if !activity.location.isEmpty {
                                                Button {
                                                    mapLocationToOpen = activity.location
                                                    showMapOptions = true
                                                } label: {
                                                    HStack(spacing: 4) {
                                                        Image(systemName: "mappin.circle.fill")
                                                            .foregroundColor(Color(hex: "#EA4335"))
                                                        Text(activity.location)
                                                            .underline()
                                                    }
                                                    .font(.system(size: 12, weight: .medium))
                                                    .foregroundColor(Color(hex: "#4285F4"))
                                                }
                                            }
                                            
                                            if !activity.description.isEmpty {
                                                Text(activity.description)
                                                    .font(.system(size: 13))
                                                    .foregroundColor(.gray)
                                                    .lineLimit(2)
                                            }
                                        }
                                        Spacer()
                                    }
                                }
                            }
                            .padding(.leading, 8)
                        }
                    }
                }
            }
        }
    }
    
    // MARK: - Gallery
    @ViewBuilder
    private func gallerySection(trip: Trip) -> some View {
        if let gallery = trip.gallery, !gallery.isEmpty {
            softDivider()
            
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 6) {
                    Image(systemName: "photo.stack") // Minimal
                        .font(.system(size: 13))
                        .foregroundColor(Color(hex: "#EC4899"))
                    Text("รูปภาพ")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.adaptiveText)
                }
                
                ScrollView(.horizontal, showsIndicators: false) {
                    let allImgs: [String] = {
                        var imgs = [String]()
                        if let m = trip.imageUrl, !m.isEmpty { imgs.append(m) }
                        if let g = trip.gallery { for i in g where !imgs.contains(i) { imgs.append(i) } }
                        return imgs
                    }()
                    
                    HStack(spacing: 12) {
                        ForEach(Array((trip.gallery ?? []).enumerated()), id: \.offset) { index, url in
                            CustomAsyncImage(url: url)
                                .frame(width: 200, height: 150)
                                .cornerRadius(14).clipped()
                                .shadow(color: .black.opacity(0.06), radius: 6, x: 0, y: 3)
                                .onTapGesture { 
                                    // Find index in overall list
                                    let globalIndex = allImgs.firstIndex(of: url) ?? 0
                                    selectedImage = ImageViewerItem(urls: allImgs, initialIndex: globalIndex) 
                                }
                        }
                    }
                }
            }
        }
    }
    
    // MARK: - Participants
    @ViewBuilder
    private func participantsSection(trip: Trip) -> some View {
        if let participants = trip.participants, !participants.isEmpty {
            softDivider()
            
            VStack(alignment: .leading, spacing: 14) {
                HStack(spacing: 6) {
                    Image(systemName: "person.3") // Minimal
                        .font(.system(size: 13))
                        .foregroundColor(Color(hex: "#0EA5E9"))
                    Text("จำนวนคน (\(participants.count))")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.adaptiveText)
                }
                
                VStack(spacing: 0) {
                    ForEach(Array(participants.enumerated()), id: \.element.id) { idx, p in
                        let isMe = p.userId == viewModel.currentUserId
                        let name = p.user?.name ?? p.name
                        
                        VStack(spacing: 0) {
                            HStack(spacing: 12) {
                                // ✅ RAINBOW FRAME & AVATAR
                                ZStack {
                                    UserAvatarView(user: p.user, size: 42)
                                    
                                    // ✅ RAINBOW RING FOR GOING
                                    let currentStatus = p.status ?? "going"
                                    if currentStatus == "going" {
                                        Circle()
                                            .stroke(Color.appPrimary, lineWidth: 3.5)
                                            .frame(width: 48, height: 48)
                                    } else if currentStatus == "interested" {
                                        Circle()
                                            .stroke(Color.orange, lineWidth: 2)
                                            .frame(width: 48, height: 48)
                                    }
                                }
                                .frame(width: 50, height: 50)
                                
                                VStack(alignment: .leading, spacing: 4) {
                                    HStack(spacing: 4) {
                                        Text(name)
                                            .font(.system(size: 16, weight: .black))
                                            .foregroundColor(.adaptiveText)
                                        
                                        if p.user?.isVerified == true {
                                            Image(systemName: "checkmark.seal.fill")
                                                .font(.system(size: 11))
                                                .foregroundColor(.blue)
                                        }
                                        
                                        if isMe {
                                            Text("(คุณ)")
                                                .font(.system(size: 13, weight: .bold))
                                                .foregroundColor(.appPrimary)
                                        }
                                    }
                                    
                                    // Status Badge (Below Name)
                                    let displayStatus = p.status ?? "going"
                                    HStack(spacing: 5) {
                                        Image(systemName: displayStatus == "interested" ? "star.fill" : "checkmark.seal.fill")
                                            .font(.system(size: 8, weight: .bold))
                                        Text(displayStatus == "interested" ? "สนใจทริปนี้" : "ไปแน่นอน!")
                                            .font(.system(size: 10, weight: .bold))
                                    }
                                    .foregroundColor(displayStatus == "interested" ? .orange : .white)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 4)
                                    .background(
                                        displayStatus == "interested" ? AnyView(Color.orange.opacity(0.15)) : AnyView(Color.appPrimary)
                                    )
                                    .cornerRadius(8)
                                }
                                
                                Spacer()
                                
                                if !isMe {
                                    // ✅ ดูโปรไฟล์ — ใช้ UserProfileView (fetch จาก API)
                                    if let user = p.user {
                                        NavigationLink(destination: UserProfileView(user: user)) {
                                            Image(systemName: "person.crop.circle")
                                                .font(.system(size: 18))
                                                .foregroundColor(.appPrimary)
                                                .frame(width: 34, height: 34)
                                        }
                                    }
                                    
                                    // แชท
                                    NavigationLink(destination: ChatDetailView(
                                        chatTitle: name, tripId: nil, partnerId: p.userId
                                    )) {
                                        Image(systemName: "paperplane")
                                            .font(.system(size: 14))
                                            .foregroundColor(Color(hex: "#0EA5E9"))
                                            .frame(width: 34, height: 34)
                                            .background(Color(hex: "#0EA5E9").opacity(0.08))
                                            .clipShape(Circle())
                                    }
                                    
                                    // ลบ (admin/creator เท่านั้น)
                                    if viewModel.isCreator || viewModel.isAdmin {
                                        Button {
                                            kickParticipantName = name
                                            kickParticipantId = p.userId
                                        } label: {
                                            Image(systemName: "xmark")
                                                .font(.system(size: 11, weight: .bold))
                                                .foregroundColor(.red.opacity(0.6))
                                                .frame(width: 28, height: 28)
                                                .background(Color.red.opacity(0.06))
                                                .clipShape(Circle())
                                        }
                                    }
                                }
                            }
                            .padding(.horizontal, 14)
                            .padding(.vertical, 13)
                            
                            if idx < participants.count - 1 {
                                Divider().padding(.leading, 66)
                            }
                        }
                    }
                }
                .background(Color.adaptiveCardBackground)
                .cornerRadius(18)
                .shadow(color: .black.opacity(0.04), radius: 8, x: 0, y: 3)
            }
        }
    }
    
    // MARK: - Action Bar
    @ViewBuilder
    private func actionBar(trip: Trip) -> some View {
        VStack(spacing: 0) {
            // Soft fade
            LinearGradient(colors: [Color.adaptiveBackground.opacity(0), Color.adaptiveBackground],
                           startPoint: .top, endPoint: .bottom)
                .frame(height: 24).allowsHitTesting(false)
            
            VStack(spacing: 12) {
                if let userId = viewModel.currentUserId,
                   let participant = trip.participants?.first(where: { $0.userId == userId }) {
                    // USER ALREADY JOINED
                    VStack(spacing: 10) {
                        HStack(spacing: 12) {
                            // Switch Status Button (Prominent)
                            Button {
                                let currentStatus = participant.status ?? "going"
                                let newStatus = (currentStatus == "going") ? "interested" : "going"
                                Task {
                                    if await viewModel.joinTrip(interests: participant.interests ?? [], status: newStatus) {
                                        try? await Task.sleep(nanoseconds: 300_000_000)
                                        await viewModel.loadTrip()
                                    }
                                }
                            } label: {
                                HStack {
                                    if viewModel.isJoining {
                                        ProgressView().scaleEffect(0.7)
                                    }
                                    Text(participant.status == "interested" ? "เปลี่ยนเป็นจะไปแน่นอน" : "เปลี่ยนเป็นสนใจ")
                                }
                                .font(.system(size: 14, weight: .bold))
                                .foregroundColor(participant.status == "interested" ? .white : .orange)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(participant.status == "interested" ? Color.appPrimary : Color.orange.opacity(0.15))
                                .cornerRadius(12)
                            }
                            .disabled(viewModel.isJoining)
                        }
                        
                        Button { viewModel.showLeaveSheet = true } label: {
                            Text("ออกจากทริป")
                                .font(.system(size: 15, weight: .bold))
                                .foregroundColor(.red.opacity(0.8))
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(Color.red.opacity(0.06))
                                .overlay(RoundedRectangle(cornerRadius: 14)
                                    .stroke(Color.red.opacity(0.2), lineWidth: 1))
                                .cornerRadius(14)
                        }
                    }
                } else if !trip.isFull {
                    // USER NOT JOINED
                    HStack(spacing: 12) {
                        // "Interested" button
                        Button {
                            showInterestedSheet = true
                        } label: {
                            HStack(spacing: 6) {
                                if viewModel.isJoining {
                                    ProgressView().tint(.yellow).scaleEffect(0.8)
                                } else {
                                    Image(systemName: "star.fill")
                                        .font(.system(size: 14, weight: .bold))
                                        .foregroundColor(.yellow)
                                }
                                Text(viewModel.isJoining ? "กำลังเข้า..." : "สนใจ")
                            }
                            .font(.system(size: 15, weight: .bold))
                            .foregroundColor(.adaptiveText)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(Color.adaptiveBackground)
                            .overlay(
                                RoundedRectangle(cornerRadius: 14)
                                    .stroke(Color.yellow, lineWidth: 3)
                            )
                            .cornerRadius(14)
                        }
                        .disabled(viewModel.isJoining)

                        // "Will Go" triggers the join flow (with interests)
                        Button { viewModel.showJoinSheet = true } label: {
                            HStack(spacing: 6) {
                                Image(systemName: "person.crop.circle.badge.plus")
                                    .font(.system(size: 14, weight: .bold))
                                Text("จะไปด้วย")
                            }
                            .font(.system(size: 15, weight: .bold))
                            .foregroundColor(.adaptiveText)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(Color.adaptiveBackground)
                            .overlay(
                                RoundedRectangle(cornerRadius: 14)
                                    .stroke(Color.appPrimary, lineWidth: 3)
                            )
                            .cornerRadius(14)
                            .shadow(color: Color.appAccent.opacity(0.2), radius: 10, x: 0, y: 4)
                        }
                    }
                } else {
                    Text("ทริปเต็มแล้ว")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(.adaptiveSecondaryText)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(Color.gray.opacity(0.08))
                        .cornerRadius(14)
                }
                
                // Removed Edit/Delete from bottom as requested, keep top buttons instead
            }
            .padding(.horizontal, 24)
            .padding(.top, 20)
            .padding(.bottom, 32)
            .background(Color.adaptiveBackground)
            .shadow(color: .black.opacity(0.1), radius: 20, x: 0, y: -5)
        }
    }
    
    // MARK: - Soft Divider
    @ViewBuilder
    private func softDivider() -> some View {
        Rectangle()
            .fill(Color.gray.opacity(0.08))
            .frame(height: 1)
            .padding(.vertical, 4)
    }
    
    // MARK: - Map Helpers
    private func openAppleMaps(location: String) {
        guard let query = location.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) else { return }
        let urlString = "maps://?q=\(query)"
        if let url = URL(string: urlString) {
            UIApplication.shared.open(url)
        }
    }
    
    private func openGoogleMaps(location: String) {
        guard let query = location.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) else { return }
        let urlString = "https://www.google.com/maps/search/?api=1&query=\(query)"
        if let url = URL(string: urlString) {
            UIApplication.shared.open(url)
        }
    }
    
    private func openGoogleMapsRoute(locations: [String]) {
        guard locations.count >= 2 else { return }
        let origin = locations.first!.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        let destination = locations.last!.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        
        var urlString = "https://www.google.com/maps/dir/?api=1&origin=\(origin)&destination=\(destination)"
        
        if locations.count > 2 {
            let waypoints = locations.dropFirst().dropLast()
                .compactMap { $0.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) }
                .joined(separator: "|")
            urlString += "&waypoints=\(waypoints)"
        }
        
        if let url = URL(string: urlString) {
            UIApplication.shared.open(url)
        }
    }
}

// MARK: - ImageViewerView with Paging Support
struct ImageViewerView: View {
    let urls: [String]
    let initialIndex: Int
    let onDismiss: () -> Void
    @Environment(\.dismiss) var dismiss
    @State private var currentIndex: Int
    
    init(urls: [String], initialIndex: Int, onDismiss: @escaping () -> Void) {
        self.urls = urls
        self.initialIndex = initialIndex
        self.onDismiss = onDismiss
        _currentIndex = State(initialValue: initialIndex)
    }

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            TabView(selection: $currentIndex) {
                ForEach(Array(urls.enumerated()), id: \.offset) { index, url in
                    CustomAsyncImage(url: url).scaledToFit()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .tag(index)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .always))
            .ignoresSafeArea()
            
            VStack {
                HStack {
                    Spacer()
                    Button {
                        onDismiss()
                        dismiss()
                    } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 20, weight: .bold))
                            .foregroundColor(.white)
                            .padding(12)
                            .background(.ultraThinMaterial)
                            .clipShape(Circle())
                    }
                    .padding(.top, 60)
                    .padding(.trailing, 20)
                }
                Spacer()
            }
        }
    }
}

#Preview {
    NavigationStack { TripDetailView(tripId: "1") }
}

// MARK: - Interest Trip Sheet
struct InterestTripSheet: View {
    @ObservedObject var viewModel: TripDetailViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var showErrorAlert = false
    
    var body: some View {
        VStack(spacing: 24) {
            Image(systemName: "star.circle.fill")
                .font(.system(size: 60))
                .foregroundColor(.yellow)
                .padding(.top, 32)
            
            VStack(spacing: 8) {
                Text("สนใจทริปนี้")
                    .font(.system(size: 22, weight: .black))
                    .foregroundColor(.adaptiveText)
                
                Text("คุณต้องการบันทึกทริปนี้เข้ารายการโปรดใช่หรือไม่?")
                    .font(.system(size: 15))
                    .foregroundColor(.adaptiveSecondaryText)
            }
            
            HStack(spacing: 16) {
                Button(action: {
                    dismiss()
                }) {
                    Text("ยกเลิก")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.black)
                        .cornerRadius(14)
                }
                
                Button(action: {
                    Task {
                        let success = await viewModel.joinTrip(interests: [], status: "interested")
                        if success {
                            dismiss()
                        } else {
                            showErrorAlert = true
                        }
                    }
                }) {
                    HStack {
                        if viewModel.isJoining {
                            ProgressView().tint(.white).scaleEffect(0.8)
                        }
                        Text(viewModel.isJoining ? "กำลังบันทึก..." : "ยืนยัน")
                            .font(.system(size: 15, weight: .bold))
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(
                        LinearGradient(colors: [.yellow, .orange], startPoint: .leading, endPoint: .trailing)
                    )
                    .cornerRadius(14)
                    .shadow(color: Color.yellow.opacity(0.3), radius: 8, x: 0, y: 4)
                }
                .disabled(viewModel.isJoining)
            }
            .padding(.horizontal, 24)
            .padding(.top, 10)
            
            Spacer()
        }
        .presentationDetents([.height(280)])
        .alert("ไม่สามารถบันทึกได้", isPresented: $showErrorAlert) {
            Button("ตรวจสอบ", role: .cancel) {}
        } message: {
            Text(viewModel.errorMessage ?? "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง")
        }
    }
}
