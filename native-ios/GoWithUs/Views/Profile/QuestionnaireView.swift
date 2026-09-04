import SwiftUI

struct QuestionnaireView: View {
    @Environment(\.dismiss) var dismiss
    @State private var currentStep = 0
    @State private var isSubmitting = false
    @State private var errorMessage = ""
    @State private var username = ""
    @State private var usernameStatus: UsernameStatus = .idle
    @State private var usernameCheckTask: Task<Void, Never>?
    @State private var birthDate = Calendar.current.date(byAdding: .year, value: -18, to: Date()) ?? Date()
    @State private var isBirthDateSet = false
    
    @EnvironmentObject var authViewModel: AuthViewModel
    
    // State
    @State private var budget: Double = 1500
    @State private var activityStyle: Double = 5
    
    // Non-linear budget steps
    private let budgetSteps: [Double] = [
        100, 300, 500, 800, 1000, 1500, 2000, 3000, 4000, 5000
    ]
    
    private var budgetSliderBinding: Binding<Double> {
        Binding<Double>(
            get: {
                let closest = budgetSteps.enumerated().min(by: { abs($0.element - budget) < abs($1.element - budget) })?.offset ?? 0
                return Double(closest)
            },
            set: { newValue in
                let index = min(max(Int(newValue), 0), budgetSteps.count - 1)
                let newBudget = budgetSteps[index]
                if budget != newBudget {
                    budget = newBudget
                    triggerHapticFeedback()
                }
            }
        )
    }
    
    private func triggerHapticFeedback() {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
    }
    @State private var startTime: Date = Calendar.current.date(bySettingHour: 9, minute: 0, second: 0, of: Date()) ?? Date()
    @State private var endTime: Date = Calendar.current.date(bySettingHour: 18, minute: 0, second: 0, of: Date()) ?? Date()
    
    @State private var timeOfDay: [String] = []
    @State private var interests: Set<String> = []
    @State private var movingForward: Bool = true
    
    @State private var userName: String = "User"
    var isOnboarding: Bool = false
    var onComplete: (() -> Void)?

    private var totalSteps: Int { isOnboarding ? 5 : 4 }
    private var displayedStep: Int { currentStep + (isOnboarding ? 0 : 1) }

    private enum UsernameStatus: Equatable {
        case idle, checking, available
        case taken(String)
        case invalid(String)
    }

    private var calculatedAge: Int {
        Calendar.current.dateComponents([.year], from: birthDate, to: Date()).year ?? 0
    }

    private func checkUsername(_ value: String) {
        usernameCheckTask?.cancel()
        let cleaned = value.trimmingCharacters(in: .whitespacesAndNewlines)

        guard !cleaned.isEmpty else { usernameStatus = .idle; return }
        guard cleaned.count >= 3 else {
            usernameStatus = .invalid("Username ต้องมีอย่างน้อย 3 ตัวอักษร")
            return
        }
        if cleaned == authViewModel.currentUser?.username {
            usernameStatus = .available
            return
        }

        usernameStatus = .checking
        usernameCheckTask = Task {
            try? await Task.sleep(nanoseconds: 500_000_000)
            guard !Task.isCancelled else { return }
            do {
                let result = try await AuthService.shared.checkUsernameAvailability(
                    username: cleaned,
                    excludeUserId: authViewModel.currentUser?.id
                )
                await MainActor.run {
                    usernameStatus = result.available ? .available : .taken(result.message)
                }
            } catch {
                await MainActor.run { usernameStatus = .idle }
            }
        }
    }
    
    // Time slots
    let timeSlots = [
        ("morning", "ช่วงเช้า (06:00 - 11:00 น.)", "เช่น ชมพระอาทิตย์ขึ้น, เยี่ยมชมตลาดเช้า"),
        ("noon", "ช่วงกลางวัน (11:00 - 16:00 น.)", "เช่น รับประทานอาหาร, พักผ่อนในคาเฟ่, เข้าชมพิพิธภัณฑ์"),
        ("evening", "ช่วงเย็น (16:00 - 20:00 น.)", "เช่น เดินพักผ่อน, ชมพระอาทิตย์ตก, รับประทานอาหารค่ำ"),
        ("night", "ช่วงกลางคืน (20:00 น. เป็นต้นไป)", "เช่น สัมผัสบรรยากาศยามค่ำคืน, เข้าร่วมงานสังสรรค์")
    ]
    
    private var timeFormatter: DateFormatter {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        return formatter
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Progress
                // Progress
                ProgressView(value: Double(currentStep + 1), total: Double(totalSteps))
                    .padding(.horizontal)
                    .tint(.black)
                
                Text("\(SettingsManager.shared.localizedString(for: "step_prefix")) \(currentStep + 1) \(SettingsManager.shared.localizedString(for: "step_suffix")) \(totalSteps)")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                // Content
                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        Group {
                            if displayedStep == 0 {
                                Text("👤 ข้อมูลส่วนตัวของคุณ")
                                    .font(.title2).bold()
                                Text("ข้อมูลนี้ช่วยให้ผู้ร่วมทริปรู้จักคุณ และใช้สร้างโปรไฟล์ของคุณ")
                                    .font(.subheadline).foregroundColor(.secondary)

                                VStack(alignment: .leading, spacing: 8) {
                                    Text("Username").font(.headline)
                                    HStack {
                                        Text("@").foregroundColor(.secondary)
                                        TextField("username", text: $username)
                                            .textInputAutocapitalization(.never)
                                            .autocorrectionDisabled(true)
                                            .onChange(of: username) { _, newValue in checkUsername(newValue) }
                                        switch usernameStatus {
                                        case .checking: ProgressView().scaleEffect(0.75)
                                        case .available: Image(systemName: "checkmark.circle.fill").foregroundColor(.green)
                                        case .taken, .invalid: Image(systemName: "xmark.circle.fill").foregroundColor(.red)
                                        default: EmptyView()
                                        }
                                    }
                                    .padding().background(Color.gray.opacity(0.1)).cornerRadius(12)

                                    switch usernameStatus {
                                    case .available: Text("Username นี้ใช้งานได้").foregroundColor(.green)
                                    case .taken(let message), .invalid(let message): Text(message).foregroundColor(.red)
                                    default: Text("ใช้อักษรอย่างน้อย 3 ตัว และต้องไม่ซ้ำกับผู้อื่น").foregroundColor(.secondary)
                                    }
                                }

                                VStack(alignment: .leading, spacing: 8) {
                                    Text("วันเกิด").font(.headline)
                                    DatePicker(
                                        "เลือกวันเกิด",
                                        selection: $birthDate,
                                        in: ...Date(),
                                        displayedComponents: .date
                                    )
                                    .datePickerStyle(.compact)
                                    .onChange(of: birthDate) { _, _ in isBirthDateSet = true }
                                    Text("อายุ \(calculatedAge) ปี")
                                        .font(.subheadline).foregroundColor(.secondary)
                                }
                                .padding().background(Color.gray.opacity(0.1)).cornerRadius(12)

                            } else if displayedStep == 1 {
                                // Budget Step
                                Text("💰 งบประมาณเฉลี่ยต่อวัน (Budget / บาท)")
                                    .font(.title2).bold()
                            Text("ระบุงบประมาณที่คุณพึงพอใจในการใช้จ่ายระหว่างทริป (ต่อวัน)")
                                .font(.subheadline).foregroundColor(.secondary)
                            
                            VStack(spacing: 30) {
                                HStack(alignment: .firstTextBaseline, spacing: 8) {
                                    TextField("1500", value: $budget, format: .number)
                                        .font(.system(size: 60, weight: .black))
                                        .foregroundColor(.primary)
                                        .keyboardType(.numberPad)
                                        .multilineTextAlignment(.center)
                                        .frame(maxWidth: 200)
                                        .tint(.black)
                                    
                                    Text("฿")
                                        .font(.title)
                                        .foregroundColor(.secondary)
                                }
                                
                                Slider(value: budgetSliderBinding, in: 0...Double(budgetSteps.count - 1), step: 1)
                                    .tint(.black)
                                
                                HStack {
                                    Text("ประหยัด (100฿)")
                                        .font(.caption).foregroundColor(.secondary)
                                    Spacer()
                                    Text("หรูหรา (5,000฿+)")
                                        .font(.caption).foregroundColor(.secondary)
                                }
                            }
                            .padding(.top, 20)
                            
                        } else if displayedStep == 2 {
                            // Activity Style Step
                            Text("🎯 วันนึงชอบเที่ยวประมาณกี่ที่?")
                                .font(.title2).bold()
                            Text("สไตล์การจัดตารางเที่ยวในแต่ละวันของคุณเป็นแบบไหน?")
                                .font(.subheadline).foregroundColor(.secondary)
                            
                            VStack(spacing: 12) {
                                QuestionnaireActivityStyleCard(title: "1-2 ที่ (สายชิล)", subtitle: "เน้นพักผ่อน อยู่ที่เดียวนานๆ ไม่รีบร้อน", value: 2, selectedValue: $activityStyle)
                                QuestionnaireActivityStyleCard(title: "3-4 ที่ (สายพอดี)", subtitle: "เที่ยวสบายๆ ได้ไปหลายที่แต่ไม่เหนื่อยเกิน", value: 5, selectedValue: $activityStyle)
                                QuestionnaireActivityStyleCard(title: "5 ที่ขึ้นไป (สายลุย)", subtitle: "ตารางแน่น เน้นเก็บให้ครบ ไปหลายที่", value: 8, selectedValue: $activityStyle)
                            }
                            .padding(.top, 20)
                            
                        } else if displayedStep == 3 {
                            // Time of Day Step
                            Text("🕘 ช่วงเวลาที่ชอบท่องเที่ยว (Time of Day)")
                                .font(.title2).bold()
                            Text("เลือกช่วงเวลาที่คุณชอบออกไปทำกิจกรรมหรือท่องเที่ยว (เลือกได้มากกว่า 1 ช่วง)")
                                .font(.subheadline).foregroundColor(.secondary)
                            
                            VStack(spacing: 12) {
                                ForEach(timeSlots, id: \.0) { slot in
                                    let (key, title, subtitle) = slot
                                    let isSelected = timeOfDay.contains(key)
                                    
                                    Button {
                                        triggerHapticFeedback()
                                        if isSelected {
                                            timeOfDay.removeAll { $0 == key }
                                        } else {
                                            timeOfDay.append(key)
                                        }
                                    } label: {
                                        HStack(alignment: .center) {
                                            VStack(alignment: .leading, spacing: 4) {
                                                Text(title)
                                                    .font(.headline)
                                                    .foregroundColor(isSelected ? .white : .primary)
                                                Text(subtitle)
                                                    .font(.caption)
                                                    .foregroundColor(isSelected ? .white.opacity(0.8) : .secondary)
                                                    .multilineTextAlignment(.leading)
                                            }
                                            Spacer()
                                            if isSelected {
                                                Image(systemName: "checkmark.circle.fill")
                                                    .foregroundColor(.white)
                                                    .font(.title3)
                                            } else {
                                                Image(systemName: "circle")
                                                    .foregroundColor(.gray)
                                                    .font(.title3)
                                            }
                                        }
                                        .padding()
                                        .background(isSelected ? Color.black : Color.gray.opacity(0.1))
                                        .cornerRadius(12)
                                        .contentShape(RoundedRectangle(cornerRadius: 12))
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                            .padding(.top, 20)
                        } else if displayedStep == 4 {
                            // Interests Step
                            HStack {
                                Text("✨ สไตล์การเที่ยวของคุณ")
                                    .font(.title2).bold()
                                Spacer()
                            }
                            Text("เลือกสไตล์การท่องเที่ยวที่คุณชอบ (เลือกได้สูงสุด 5 ข้อ) เพื่อให้เราแนะนำทริปที่โดนใจคุณมากที่สุด")
                                .font(.subheadline).foregroundColor(.secondary)
                            
                            ForEach(INTEREST_SECTIONS) { section in
                                Text(section.title)
                                    .font(.headline)
                                    .padding(.top, 16)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                
                                LazyVGrid(columns: [
                                    GridItem(.flexible(), spacing: 12),
                                    GridItem(.flexible(), spacing: 12),
                                    GridItem(.flexible(), spacing: 12)
                                ], spacing: 16) {
                                    ForEach(section.categories) { cat in
                                        QuestionnaireInterestCard(
                                            label: cat.label,
                                            icon: cat.icon,
                                            isSelected: interests.contains(cat.label)
                                        ) {
                                            triggerHapticFeedback()
                                            if interests.contains(cat.label) {
                                                interests.remove(cat.label)
                                            } else {
                                                if interests.count < 5 {
                                                    interests.insert(cat.label)
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            .padding(.top, 20)
                        }
                        } // Closes Group
                        .transition(.asymmetric(
                            insertion: .move(edge: movingForward ? .trailing : .leading),
                            removal: .move(edge: movingForward ? .leading : .trailing)
                        ))
                        .id(currentStep)
                    }
                    .padding()
                }
                .scrollDismissesKeyboard(.interactively)
                
                if !errorMessage.isEmpty {
                    Text(errorMessage)
                        .foregroundColor(.red)
                        .font(.caption)
                }
                
                // Footer Navigation
                HStack {
                    if currentStep > 0 {
                        Button("ย้อนกลับ") {
                            triggerHapticFeedback()
                            if currentStep > 0 {
                                movingForward = false
                                withAnimation(.easeInOut) { currentStep -= 1 }
                            }
                        }
                        .padding()
                        .foregroundColor(.primary)
                    }
                    
                    Spacer()
                    
                    Button {
                        triggerHapticFeedback()
                        
                        if displayedStep == 0 {
                            let cleanedUsername = username.trimmingCharacters(in: .whitespacesAndNewlines)
                            if cleanedUsername.isEmpty || usernameStatus != .available {
                                errorMessage = "กรุณาระบุ Username ที่สามารถใช้งานได้"
                                return
                            }
                            if !isBirthDateSet {
                                errorMessage = "กรุณาเลือกวันเกิดเพื่อระบุอายุ"
                                return
                            }
                        }
                        if displayedStep == 3 && timeOfDay.isEmpty {
                            errorMessage = "โปรดเลือกอย่างน้อย 1 ช่วงเวลา"
                            return
                        }
                        if displayedStep == 4 && interests.isEmpty {
                            errorMessage = "โปรดเลือกอย่างน้อย 1 สไตล์"
                            return
                        }
                        
                        errorMessage = ""
                        
                        if currentStep < totalSteps - 1 {
                            movingForward = true
                            withAnimation(.easeInOut) { currentStep += 1 }
                        } else {
                            submitQuestionnaire()
                        }
                    } label: {
                        if isSubmitting {
                            ProgressView().progressViewStyle(CircularProgressViewStyle(tint: .white))
                        } else {
                            Text(currentStep == totalSteps - 1 ? "เสร็จสิ้น" : "ถัดไป")
                                .bold()
                        }
                    }
                    .frame(width: 120, height: 50)
                    .background(Color.black)
                    .foregroundColor(.white)
                    .cornerRadius(25)
                    .disabled(isSubmitting)
                }
                .padding()
            }
            .navigationTitle("แบบสอบถาม")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("ข้าม") {
                        if isOnboarding {
                            authViewModel.needsOnboarding = false
                        }
                        dismiss()
                    }
                }
            }
        }
        .task {
            // Load existing preferences if available
            do {
                let user = try await AuthService.shared.getCurrentUser()
                userName = user.name
                username = user.username ?? ""
                if !username.isEmpty { usernameStatus = .available }
                if let existingBirthDate = user.birthDate {
                    birthDate = existingBirthDate
                    isBirthDateSet = true
                }
                if let existingInterests = user.interests {
                    interests = Set(existingInterests)
                }
                if let style = user.travelStyle {
                    if let b = style.budget { budget = Double(b) }
                    if let a = style.activityStyle { activityStyle = Double(a) }
                    if let t = style.timeOfDay { timeOfDay = t }
                }
            } catch {
                print("Could not fetch user for questionnaire: \(error)")
            }
        }
    }
    
    private func submitQuestionnaire() {
        guard !isSubmitting else { return }
        isSubmitting = true
        errorMessage = ""
        
        Task {
            do {
                let travelStyle = TravelStyle(
                    budget: Int(budget),
                    activityStyle: Int(activityStyle),
                    timeOfDay: timeOfDay
                )
                
                let updatedUser = try await AuthService.shared.updateProfile(
                    name: userName,
                    interests: Array(interests).sorted(),
                    age: isOnboarding ? calculatedAge : nil,
                    birthDate: isOnboarding ? birthDate : nil,
                    travelStyle: travelStyle,
                    username: isOnboarding
                        ? username.trimmingCharacters(in: .whitespacesAndNewlines)
                        : nil
                )
                
                await authViewModel.loadCurrentUser()
                
                DispatchQueue.main.async {
                    MatchTripViewModel.invalidateCache()
                    self.isSubmitting = false
                    self.onComplete?()
                    if self.isOnboarding {
                        self.authViewModel.needsOnboarding = false
                    }
                    self.dismiss()
                }
            } catch {
                DispatchQueue.main.async {
                    self.isSubmitting = false
                    self.errorMessage = "Failed to save profile: \(error.localizedDescription)"
                }
            }
        }
    }
}

struct QuestionnaireInfoRow: View {
    let range: String
    let label: String
    
    var body: some View {
        HStack(alignment: .top) {
            Text(range)
                .font(.caption)
                .bold()
                .frame(width: 40, alignment: .leading)
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

#Preview {
    QuestionnaireView()
        .environmentObject(AuthViewModel())
}

struct QuestionnaireInterestCard: View {
    let label: String
    let icon: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 12) {
                Text(icon)
                    .font(.system(size: 36))
                Text(label)
                    .font(.system(size: 14, weight: .bold))
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 110)
            .background(isSelected ? Color.appPrimary : Color.gray.opacity(0.05))
            .foregroundColor(isSelected ? .white : .adaptiveText)
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(isSelected ? Color.appPrimary : Color.gray.opacity(0.2), lineWidth: 1)
            )
            .cornerRadius(16)
            .contentShape(RoundedRectangle(cornerRadius: 16))
            .shadow(color: isSelected ? Color.appPrimary.opacity(0.3) : Color.clear, radius: 5, x: 0, y: 3)
        }
        .buttonStyle(PlainButtonStyle())
        .scaleEffect(isSelected ? 1.05 : 1.0)
        .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isSelected)
    }
}

struct QuestionnaireActivityStyleCard: View {
    let title: String
    let subtitle: String
    let value: Double
    @Binding var selectedValue: Double
    
    var body: some View {
        let isSelected = selectedValue == value
        Button {
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            selectedValue = value
        } label: {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.headline)
                        .foregroundColor(isSelected ? .white : .primary)
                    Text(subtitle)
                        .font(.caption)
                        .foregroundColor(isSelected ? .white.opacity(0.8) : .secondary)
                        .multilineTextAlignment(.leading)
                }
                Spacer()
                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.white)
                        .font(.title3)
                } else {
                    Image(systemName: "circle")
                        .foregroundColor(.gray)
                        .font(.title3)
                }
            }
            .padding()
            .background(isSelected ? Color.black : Color.gray.opacity(0.1))
            .cornerRadius(12)
            .contentShape(RoundedRectangle(cornerRadius: 12))
        }
        .buttonStyle(.plain)
    }
}
