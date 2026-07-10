# Chương 5: Kế hoạch Kiểm thử, Xác thực ML Pipeline, Metrics & Coverage

Chương này mô tả đầy đủ chiến lược kiểm thử đã được bổ sung cho dự án **CV-VQA-MEDICAL**, với mục tiêu bao phủ cả lớp xử lý nghiệp vụ backend, pipeline suy luận ML, giao diện frontend và các chỉ số quan sát hệ thống. Toàn bộ phần kiểm thử được triển khai theo hướng **thêm test mới**, không can thiệp vào logic ứng dụng hiện có.

---

## 5.1 Mục tiêu và phạm vi kiểm thử

Mục tiêu của giai đoạn kiểm thử lần này là xác thực các điểm rủi ro chính trong hệ thống y tế đa phương thức:

- Xác thực dữ liệu đầu vào trước khi đi vào suy luận mô hình.
- Đảm bảo cơ chế cache hoạt động đúng đối với các truy vấn VQA và captioning lặp lại.
- Kiểm tra trạng thái sẵn sàng của mô hình trước khi nhận request thật.
- Xác minh các API quan sát hệ thống như health, readiness và metrics.
- Đảm bảo luồng điều hướng frontend theo trạng thái đăng nhập và phân quyền hoạt động đúng.

Phạm vi kiểm thử bao gồm 3 lớp chính:

- Unit test cho lớp service và pipeline.
- Integration test cho API quan sát và analytics.
- UI test cho frontend bằng Playwright.

---

## 5.2 Kiến trúc kiểm thử theo tầng

### 5.2.1 Unit Layer

Tầng unit tập trung vào lớp xử lý nghiệp vụ có độ ổn định cao nhưng nhạy cảm với lỗi đầu vào, cụ thể là `PredictionService`.

Test file chính:

- `tests/unit/test_prediction_service_layers.py`

Các kịch bản đã bao phủ:

- Từ chối câu hỏi rỗng trước khi gọi mô hình.
- Trả kết quả từ Redis cache khi cùng ảnh và cùng câu hỏi được lặp lại.
- Từ chối request khi pipeline chưa sẵn sàng.
- Từ chối ảnh vượt giới hạn kích thước khi sinh caption.

Ý nghĩa của tầng này là chặn lỗi sớm, giảm chi phí suy luận và tránh làm nóng mô hình khi input không hợp lệ.

### 5.2.2 Integration Layer

Tầng integration xác thực hành vi của các API quan sát và tổng hợp dữ liệu vận hành.

Test file chính:

- `tests/integration/test_observability_and_analytics_api.py`

Các kịch bản đã bao phủ:

- `/health` trả về trạng thái hệ thống và version.
- `/ready` phản ánh đúng trạng thái sẵn sàng của ML pipeline.
- `/metrics` xuất Prometheus metrics để phục vụ giám sát.
- API analytics admin hoạt động khi dependency phân quyền được thỏa mãn.

Tầng này giúp kiểm tra các điểm tích hợp quan trọng giữa application, hệ thống giám sát và phân quyền.

### 5.2.3 UI Layer

Tầng UI kiểm tra hành vi điều hướng và render của frontend dựa trên trạng thái auth.

Test file chính:

- `frontend/tests/ui/auth-page.spec.ts`
- `frontend/tests/ui/protected-routes.spec.ts`

Các kịch bản đã bao phủ:

- Trang đăng nhập hiển thị đúng các thành phần chính.
- Trang đăng ký hiển thị đúng các trường nhập liệu và hành động.
- Người dùng chưa đăng nhập bị chuyển hướng về `/login`.
- Người dùng không có quyền admin bị chặn khỏi trang admin.
- Người dùng bắt buộc đổi mật khẩu trước khi vào các route được bảo vệ.

---

## 5.3 Xác thực ML Pipeline

Pipeline ML của dự án gồm hai nhánh chính: Visual Question Answering và Image Captioning. Trong hệ thống này, việc xác thực pipeline không chỉ là kiểm tra model có chạy hay không, mà còn phải đảm bảo pipeline phản ứng đúng với đầu vào biên và trạng thái runtime.

### 5.3.1 Xác thực trước suy luận

Các kiểm thử mới xác minh rằng request phải được chặn ngay khi vi phạm điều kiện tối thiểu:

- Câu hỏi rỗng không được phép đi vào pipeline.
- Ảnh không hợp lệ hoặc vượt ngưỡng dung lượng phải bị từ chối sớm.
- Pipeline chưa load xong model phải trả về lỗi `503` thay vì cố suy luận tiếp.

### 5.3.2 Xác thực cache và tái sử dụng kết quả

Hệ thống dùng SHA-256 của ảnh và câu hỏi để tạo cache key. Test mới đã xác nhận:

- Khi có cache hit, service trả kết quả ngay mà không gọi model lại.
- Khi không có cache hit, service mới đi tiếp đến bước upload tạm và suy luận model.

Điểm này rất quan trọng với hệ thống y tế vì nhiều truy vấn lặp lại có thể xuất hiện trong cùng một ca bệnh hoặc cùng một session chat.

### 5.3.3 Xác thực nhánh captioning

Ngoài VQA, pipeline captioning cũng được kiểm tra riêng ở mức giới hạn đầu vào:

- Ảnh vượt giới hạn kích thước phải bị từ chối bằng lỗi phù hợp.
- Việc kiểm tra này giúp tránh tốn tài nguyên cho các ảnh lớn bất thường.

---

## 5.4 Metrics & Observability

Hệ thống có tích hợp Prometheus metrics và readiness endpoint để phục vụ giám sát runtime. Bộ test mới đã đưa các thành phần này vào phạm vi kiểm thử để đảm bảo hệ thống có thể được theo dõi đúng trong môi trường triển khai.

### 5.4.1 Health Check

Endpoint health được dùng để xác nhận API có đang sống hay không. Test đã kiểm tra:

- Trạng thái trả về là `healthy`.
- Có phiên bản ứng dụng đi kèm response.

### 5.4.2 Readiness Check

Readiness là lớp kiểm tra quan trọng hơn health vì nó phản ánh khả năng xử lý request thật:

- Khi model đã sẵn sàng, endpoint trả `ready`.
- Khi model chưa sẵn sàng, endpoint trả `503`.

Điều này đặc biệt cần thiết khi backend mới khởi động hoặc đang load mô hình nặng vào RAM/VRAM.

### 5.4.3 Prometheus Metrics

Test integration đã xác minh `/metrics` xuất dữ liệu quan sát tiêu chuẩn, giúp hệ thống có thể:

- Tích hợp với Prometheus.
- Theo dõi performance và lifecycle của ứng dụng.
- Hỗ trợ chẩn đoán sự cố trong môi trường staging hoặc production.

---

## 5.5 Cấu hình chạy kiểm thử frontend

Để các spec Playwright chạy được thật trong workspace, frontend đã được bổ sung cấu hình runner riêng:

- `frontend/playwright.config.ts`

Các đặc điểm chính của cấu hình:

- Tự khởi động Vite dev server ở port cố định.
- Dùng `baseURL` nội bộ để test truy cập các route của ứng dụng.
- Chạy một project Chromium cho suite UI.
- Hỗ trợ chạy local và CI với chính sách retries phù hợp.

Ngoài ra, đã bổ sung script:

- `npm run test:e2e`
- `npm run test:e2e:headed`

---

## 5.6 Danh sách file kiểm thử đã bổ sung

- `tests/unit/test_prediction_service_layers.py`
- `tests/integration/test_observability_and_analytics_api.py`
- `frontend/tests/ui/auth-page.spec.ts`
- `frontend/tests/ui/protected-routes.spec.ts`

---

## 5.7 Kết quả xác thực

Kết quả kiểm thử đã chạy thành công trong workspace:

- Backend pytest chạy ở mức suite hiện có trong repository.
- Frontend Playwright suite chạy thành công với 5/5 test pass sau khi cài browser runtime và tinh chỉnh selector.

Điều này cho thấy các test mới không chỉ đúng về mặt cú pháp mà còn có thể chạy thực tế trong môi trường dev hiện tại.

---

## 5.8 Nhận xét về coverage

Các test mới tập trung vào những nhánh có rủi ro cao thay vì chỉ kiểm tra happy path:

- Nhánh validate input.
- Nhánh cache hit.
- Nhánh model not ready.
- Nhánh health/readiness/metrics.
- Nhánh điều hướng auth trên frontend.

Đây là cách tiếp cận phù hợp với hệ thống CV-VQA-MEDICAL vì bài toán y tế thường yêu cầu độ tin cậy cao và khả năng phản ứng đúng với input biên.

---

## 5.9 Kết luận

Bộ kiểm thử được bổ sung đã hoàn thiện một lớp bảo vệ quan trọng cho hệ thống:

- An toàn hơn ở tầng xử lý ML.
- Rõ ràng hơn ở tầng quan sát hệ thống.
- Ổn định hơn ở tầng frontend.

Quan trọng nhất, toàn bộ thay đổi được thực hiện theo đúng ràng buộc ban đầu: **chỉ thêm test và tài liệu, không sửa logic ứng dụng hiện có**.