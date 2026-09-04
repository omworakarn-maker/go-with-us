import Foundation
import Combine

// MARK: - Trip List ViewModel
@MainActor
class TripListViewModel: ObservableObject {
    @Published var trips: [Trip] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var searchText = ""
    
    // Filters
    @Published var activeTab: String = "แนะนำ" {
        didSet { Task { await loadTrips(force: true) } }
    }
    @Published var selectedProvince: String? {
        didSet { Task { await loadTrips(force: true) } }
    }
    @Published var selectedDate: Date? {
        didSet { Task { await loadTrips(force: true) } }
    }
    @Published var selectedEndDate: Date? {
        didSet { Task { await loadTrips(force: true) } }
    }
    @Published var selectedCategory: TripCategory? {
        didSet { Task { await loadTrips(force: true) } }
    }
    
    private var cancellables = Set<AnyCancellable>()
    
    private static var lastLoaded: Date? = nil
    private static var cachedTrips: [Trip] = []
    
    static func invalidateCache() {
        lastLoaded = nil
        cachedTrips = []
    }
    
    init() {
        self.trips = Self.cachedTrips
        setupSearch()
    }
    
    private func setupSearch() {
        $searchText
            .debounce(for: .milliseconds(300), scheduler: RunLoop.main)
            .sink { [weak self] _ in
                Task { [weak self] in
                    await self?.loadTrips()
                }
            }
            .store(in: &cancellables)
    }
    
    private var currentLoadTask: Task<Void, Never>?

    func loadTrips(showLoading: Bool = true, force: Bool = false) async {
        if !force, let lastLoaded = Self.lastLoaded, Date().timeIntervalSince(lastLoaded) < 180, !Self.cachedTrips.isEmpty {
            var filtered = Self.cachedTrips
            
            // Local search filtering on cached trips
            if !searchText.isEmpty {
                filtered = filtered.filter { trip in
                    trip.title.localizedCaseInsensitiveContains(searchText) ||
                    trip.destination.localizedCaseInsensitiveContains(searchText) ||
                    (trip.description?.localizedCaseInsensitiveContains(searchText) ?? false)
                }
            }
            
            self.trips = filtered
            return
        }
        
        currentLoadTask?.cancel()
        
        let task = Task {
            if showLoading {
                isLoading = true
                errorMessage = nil
                trips = [] 
            }
            
            // Fix: Return early if running in SwiftUI Previews to prevent network timeout
            if AppRuntime.isRunningForPreview {
                self.isLoading = false
                return
            }
            
            do {
                // Map tab to API type
                let type: String
                switch activeTab {
                case "ยอดนิยม", "มาแรง": type = "popular"
                case "แนะนำ": type = "recommended"
                case "มาใหม่": type = "new"
                default: type = "recommended"
                }
                
                // Fetch with filters
                let fetchedTrips = try await TripService.shared.getAllTrips(
                    type: type,
                    destination: selectedProvince == "ทุกจังหวัด" ? nil : selectedProvince,
                    startDate: selectedDate,
                    category: selectedCategory
                )
                
                if Task.isCancelled { return }
                
                var filtered = fetchedTrips
                
                // Local Filtering for End Date
                if let userSelectionEnd = selectedEndDate {
                     filtered = filtered.filter { $0.startDate <= userSelectionEnd }
                }
                
                // Cache before search filtering
                Self.cachedTrips = filtered
                Self.lastLoaded = Date()
                
                // Local search filtering
                if !searchText.isEmpty {
                    filtered = filtered.filter { trip in
                        trip.title.localizedCaseInsensitiveContains(searchText) ||
                        trip.destination.localizedCaseInsensitiveContains(searchText) ||
                        (trip.description?.localizedCaseInsensitiveContains(searchText) ?? false)
                    }
                }
                
                self.trips = filtered
                
            } catch let error as URLError where error.code == .cancelled {
                return 
            } catch {
                if !Task.isCancelled {
                    errorMessage = error.localizedDescription
                }
            }
            
            if !Task.isCancelled {
                isLoading = false
            }
        }
        
        currentLoadTask = task
        await task.value
    }
    
    func refresh() async {
        await loadTrips(showLoading: false, force: true)
    }
}
