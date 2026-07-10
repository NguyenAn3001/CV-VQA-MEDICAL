# Chương 2: Features

## 2.1 Core AI Capabilities & User Interface

Đây là nhóm tính năng tạo nên giá trị cốt lõi của sản phẩm, giúp người dùng tương tác với các mô hình Trí tuệ Nhân tạo y tế một cách tự nhiên và hiệu quả.

*   **Medical Image Captioning:** 
    *   Hệ thống có khả năng tự động nhận diện và tạo ra các đoạn văn bản (caption) chi tiết mô tả nội dung của các hình ảnh y tế được tải lên (như X-quang, MRI, CT scan).
    *   Tính năng này cung cấp một bản tóm tắt nhanh chóng, hỗ trợ các bác sĩ trong việc đưa ra đánh giá ban đầu.
*   **Visual Question Answering - VQA:** 
    *   Cho phép người dùng đặt các câu hỏi cụ thể bằng ngôn ngữ tự nhiên về một bức ảnh y tế.
    *   Hệ thống sẽ phân tích hình ảnh kết hợp với ngữ nghĩa của câu hỏi để đưa ra câu trả lời chính xác mang tính chuyên môn y khoa.
*   **Conversational AI Web Interface:** 
    *   Xây dựng một giao diện trò chuyện (chat interface) hiện đại theo phong cách ChatGPT, mang lại trải nghiệm người dùng mượt mà và trực quan.
    *   Hỗ trợ hỏi đáp liên tục theo ngữ cảnh: Người dùng có thể đặt các câu hỏi nối tiếp nhau về cùng một bức ảnh mà không cần tải lại trang.
    *   Giao diện hỗ trợ hiển thị định dạng Markdown, giúp văn bản trả lời từ AI được trình bày rõ ràng, dễ đọc (ví dụ: in đậm, danh sách, bảng biểu).
*   **Session Management - UI:** 
    *   Người dùng có thể khởi tạo vô số các phiên trò chuyện (chat sessions) mới.
    *   Lịch sử các cuộc trò chuyện được lưu trữ và hiển thị trực quan ở thanh điều hướng bên (sidebar).
    *   Cung cấp tính năng ghim (pin) các phiên thảo luận quan trọng để dễ dàng truy cập lại và chức năng xóa (delete) để dọn dẹp các phiên không còn cần thiết.

## 2.2 User & Security Management

Đảm bảo an toàn dữ liệu y tế và kiểm soát truy cập chặt chẽ là yêu cầu bắt buộc đối với hệ thống này.

*   **User Registration & Authentication:** 
    *   Cung cấp màn hình đăng nhập và đăng ký với tính năng xác thực biểu mẫu (form validation) nghiêm ngặt để đảm bảo dữ liệu đầu vào hợp lệ.
    *   Hệ thống xác thực được xây dựng dựa trên tiêu chuẩn JWT (JSON Web Tokens), sử dụng cơ chế Access Token (mã truy cập ngắn hạn) và Refresh Token (mã làm mới dài hạn) để cân bằng giữa bảo mật và trải nghiệm người dùng.
*   **Kiểm soát truy cập dựa trên vai trò (Role-Based Access Control - RBAC):** 
    *   Hệ thống phân quyền rõ ràng giữa hai nhóm người dùng chính: `User` (Bác sĩ, sinh viên, người dùng thông thường) và `Admin` (Quản trị viên hệ thống).
    *   RBAC được thực thi ở cả hai cấp độ: Backend (bảo vệ các API endpoint nhạy cảm) và Frontend (hiển thị hoặc ẩn các menu/trang dựa trên quyền của người dùng).
*   **Profile & Settings - UI:** 
    *   Người dùng có không gian riêng để xem thông tin hồ sơ của mình.
    *   Tích hợp tính năng thay đổi mật khẩu an toàn, yêu cầu xác nhận mật khẩu cũ trước khi thiết lập mật khẩu mới.
*   **Admin Dashboard - UI:** 
    *   Cung cấp một chế độ xem (dashboard) độc quyền dành riêng cho quản trị viên.
    *   Cho phép Admin theo dõi các số liệu tổng quan về người dùng, quản lý danh sách tài khoản (bao gồm kích hoạt, vô hiệu hóa tài khoản tạm thời), thiết lập lại mật khẩu cho người dùng khi cần thiết và giám sát các cấu hình hệ thống.

## 2.3 System & Performance Features

Nhóm tính năng này đảm bảo hệ thống hoạt động ổn định, phản hồi nhanh chóng và có khả năng mở rộng tốt dưới tải trọng cao.

*   **Real-time Chat Streaming - SSE:** 
    *   Sử dụng công nghệ Server-Sent Events (SSE) để truyền phát câu trả lời từ AI (Backend) tới giao diện React (Frontend) theo từng từ (word-by-word) ngay khi AI đang suy luận.
    *   Điều này giúp giảm thiểu đáng kể độ trễ cảm nhận (perceived latency), kết hợp với hiệu ứng đang gõ (typing indicators) để mang lại cảm giác tương tác tự nhiên, mượt mà như đang nói chuyện với người thật.
*   **Bộ nhớ đệm thông minh tối ưu hóa suy luận (Intelligent Caching):** 
    *   Các tác vụ AI (chạy mô hình ViT, GPT-2, PubMedBERT) tiêu tốn rất nhiều tài nguyên GPU/CPU.
    *   Backend được tích hợp cơ chế caching thông minh: Lưu trữ kết quả suy luận vào Redis dựa trên mã băm (SHA-256) của sự kết hợp giữa hình ảnh và câu hỏi. Nếu có truy vấn trùng lặp, hệ thống sẽ trả kết quả từ cache ngay lập tức thay vì chạy lại mô hình ML.
*   **Lưu trữ đối tượng an toàn & tạm thời (Secure Object Storage):** 
    *   Hình ảnh y tế tải lên được lưu trữ an toàn trong một hệ thống Object Storage (MinIO).
    *   Frontend sẽ nhận và hiển thị hình ảnh thông qua các "Presigned URLs" (URL được ký trước) có thời hạn giới hạn (ví dụ: 2 giờ). Điều này đảm bảo ảnh không bị rò rỉ hoặc truy cập trái phép sau khi phiên kết thúc.
*   **State Management - Frontend:** 
    *   Sử dụng thư viện quản lý trạng thái toàn cục (như Zustand) để duy trì tính đồng nhất của dữ liệu trên toàn bộ ứng dụng React (ví dụ: trạng thái đăng nhập, thông tin người dùng, danh sách chat).
    *   Việc quản lý state hiệu quả giúp giảm thiểu các thao tác gọi API dư thừa và ngăn chặn hiện tượng re-render (kết xuất lại) giao diện không cần thiết, làm tăng hiệu năng Frontend.
*   **Rate Limiting & Observability:** 
    *   Rate Limiting tại Backend nhằm bảo vệ các endpoint thực thi Machine Learning khỏi bị lạm dụng hoặc tấn công DDoS (ví dụ: giới hạn 30 request/phút).
    *   Tích hợp Prometheus metrics để giám sát liên tục tình trạng sức khỏe của hệ thống, giúp đội ngũ vận hành dễ dàng theo dõi hiệu năng và phát hiện sự cố.
