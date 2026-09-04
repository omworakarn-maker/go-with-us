import Foundation
import Combine

// MARK: - Auth ViewModel
@MainActor
class AuthViewModel: ObservableObject {
    @Published var email = ""
    @Published var password = ""
    @Published var confirmPassword = ""
    @Published var name = ""
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var needsOnboarding = false
    @Published var showOTPVerification = false
    
    init() {
        checkAuthStatus()
    }
    
    // MARK: - Check Auth Status
    func checkAuthStatus() {
        guard !AppRuntime.isRunningForPreview else {
            isAuthenticated = false
            return
        }

        isAuthenticated = AuthService.shared.isLoggedIn()
        
        if isAuthenticated {
            Task {
                await loadCurrentUser()
            }
        }
    }
    
    // MARK: - Load Current User
    func loadCurrentUser() async {
        do {
            currentUser = try await AuthService.shared.getCurrentUser()
            
            // SECURITY FIX: Prevent bypassing OTP by restarting the app
            if let user = currentUser, user.isEmailVerified == false {
                print("⚠️ User has token but email is NOT verified. Forcing OTP screen.")
                showOTPVerification = true
            }
        } catch let error as URLError where error.code == .cancelled {
            // Ignore cancellation, don't logout
        } catch {
            // Token might be expired, logout
            logout()
        }
    }
    
    // MARK: - Login
    func login() async {
        guard !email.isEmpty, !password.isEmpty else {
            errorMessage = "กรุณากรอกอีเมลและรหัสผ่าน"
            return
        }
        
        isLoading = true
        errorMessage = nil
        
        do {
            print("🔐 Starting login...")
            let user = try await AuthService.shared.login(email: email, password: password)
            print("✅ Login successful! User: \(user.name)")
            currentUser = user
            isAuthenticated = true
            print("✅ isAuthenticated set to: \(isAuthenticated)")
            // Fetch full profile immediately so all fields (bio, gender, etc.) are available
            await loadCurrentUser()
        } catch APIError.needsVerification {
            print("⚠️ Login needs verification")
            showOTPVerification = true
        } catch {
            print("❌ Login failed: \(error.localizedDescription)")
            let errStr = error.localizedDescription
            if errStr.contains("401") || errStr.contains("404") || errStr.contains("400") {
                errorMessage = "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
            } else {
                errorMessage = errStr
            }
        }
        
        isLoading = false
    }
    
    // MARK: - Register
    func register() async {
        guard !name.isEmpty, !email.isEmpty, !password.isEmpty, !confirmPassword.isEmpty else {
            errorMessage = "กรุณากรอกข้อมูลให้ครบถ้วน"
            return
        }
        
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let emailPredicate = NSPredicate(format:"SELF MATCHES %@", emailRegex)
        guard emailPredicate.evaluate(with: email) else {
            errorMessage = "รูปแบบอีเมลไม่ถูกต้อง"
            return
        }
        
        guard password.count >= 6 else {
            errorMessage = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"
            return
        }
        
        guard password == confirmPassword else {
            errorMessage = "รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน"
            return
        }
        
        isLoading = true
        errorMessage = nil
        
        do {
            let user = try await AuthService.shared.register(name: name, email: email, password: password)
            currentUser = user
            showOTPVerification = true
            // Do NOT set needsOnboarding here, because it triggers a fullScreenCover conflict.
        } catch {
            let errStr = error.localizedDescription
            if errStr.contains("400") || errStr.contains("409") {
                errorMessage = "อีเมลนี้อาจมีผู้ใช้งานแล้ว หรือข้อมูลไม่ถูกต้อง"
            } else {
                errorMessage = errStr
            }
        }
        
        isLoading = false
    }
    
    // MARK: - Verify OTP
    func verifyOTP(otp: String) async -> Bool {
        isLoading = true
        errorMessage = nil
        do {
            try await AuthService.shared.verifyOTP(email: email, otp: otp)
            isAuthenticated = true
            showOTPVerification = false
            needsOnboarding = true // Trigger onboarding ONLY after OTP is verified
            isLoading = false
            return true
        } catch {
            errorMessage = "รหัส OTP ไม่ถูกต้องหรือหมดอายุ"
            isLoading = false
            return false
        }
    }
    
    // MARK: - Resend OTP
    func resendOTP() async {
        isLoading = true
        errorMessage = nil
        do {
            try await AuthService.shared.resendOTP(email: email)
            errorMessage = "ส่งรหัส OTP ใหม่เรียบร้อยแล้ว"
        } catch {
            errorMessage = "ไม่สามารถส่งรหัส OTP ได้ กรุณาลองใหม่"
        }
        isLoading = false
    }
    
    // MARK: - Logout
    func logout() {
        AuthService.shared.logout()
        isAuthenticated = false
        currentUser = nil
        email = ""
        password = ""
        confirmPassword = ""
        name = ""
    }
    
    // MARK: - Admin Update Profile
    func adminUpdateProfile(
        userId: String,
        name: String,
        username: String? = nil,
        interests: [String],
        gender: String? = nil,
        age: Int? = nil,
        bio: String? = nil,
        birthDate: Date? = nil,
        travelStyle: TravelStyle? = nil,
        profileImage: String? = nil,
        gallery: [String]? = nil
    ) async throws {
        isLoading = true
        errorMessage = nil
        
        do {
            _ = try await AuthService.shared.adminUpdateProfile(
                userId: userId,
                name: name,
                interests: interests,
                gender: gender,
                age: age,
                bio: bio,
                birthDate: birthDate,
                travelStyle: travelStyle,
                profileImage: profileImage,
                gallery: gallery,
                username: username
            )
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
            throw error
        }
        
        isLoading = false
    }

    // MARK: - Update Profile
    func updateProfile(
        name: String,
        username: String? = nil,
        interests: [String],
        gender: String? = nil,
        age: Int? = nil,
        bio: String? = nil,
        birthDate: Date? = nil,
        travelStyle: TravelStyle? = nil,
        profileImage: String? = nil,
        gallery: [String]? = nil
    ) async {
        isLoading = true
        errorMessage = nil
        
        do {
            currentUser = try await AuthService.shared.updateProfile(
                name: name,
                interests: interests,
                gender: gender,
                age: age,
                bio: bio,
                birthDate: birthDate,
                travelStyle: travelStyle,
                profileImage: profileImage,
                gallery: gallery,
                username: username
            )
        } catch {
            errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
    

}
