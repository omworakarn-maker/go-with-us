import SwiftUI
import Combine

class ImageLoader: ObservableObject {
    @Published var image: UIImage?
    private var cancellable: AnyCancellable?
    private static let cache = NSCache<NSString, UIImage>()
    
    func load(from urlString: String?) {
        guard !AppRuntime.isRunningForPreview else { return }

        guard let urlString = urlString, !urlString.isEmpty else {
            return
        }
        // Check cache first
        if let cachedImage = Self.cache.object(forKey: urlString as NSString) {
            self.image = cachedImage
            return
        }
        
        // Check for Base64 string (either with data:image prefix or pure base64)
        var possibleBase64 = urlString
        if urlString.hasPrefix("data:image"), let base = urlString.components(separatedBy: ",").last {
            possibleBase64 = base
        }
        
        // If it's a very long string without http/https, it's likely pure base64
        if !possibleBase64.hasPrefix("http") && possibleBase64.count > 100 {
            DispatchQueue.global(qos: .userInitiated).async {
                let cleaned = possibleBase64.replacingOccurrences(of: " ", with: "")
                                            .replacingOccurrences(of: "\n", with: "")
                                            .replacingOccurrences(of: "\r", with: "")
                if let data = Data(base64Encoded: cleaned, options: .ignoreUnknownCharacters),
                   let uiImage = UIImage(data: data) {
                    
                    Self.cache.setObject(uiImage, forKey: urlString as NSString)
                    
                    DispatchQueue.main.async { [weak self] in
                        self?.image = uiImage
                    }
                }
            }
            return
        }
        
        guard let url = URL(string: urlString) else {
            return
        }
        
        cancellable = URLSession.shared.dataTaskPublisher(for: url)
            .map { UIImage(data: $0.data) }
            .replaceError(with: nil)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] loadedImage in
                if let loadedImage = loadedImage {
                    Self.cache.setObject(loadedImage, forKey: urlString as NSString)
                    self?.image = loadedImage
                }
            }
    }
    
    func cancel() {
        cancellable?.cancel()
    }
}
