# Chương 1: Yêu cầu người dùng (Yêu cầu nghiệp vụ)

## 1. Tổng quan dự án

### 1.1 Bối cảnh

CV-VQA-MEDICAL, được hiển thị trên giao diện hiện tại với tên MedVQA, là đồ án môn Xử lý ảnh ở bậc đại học nhằm nghiên cứu khả năng hiểu ảnh y tế. Dự án kết hợp hỏi đáp dựa trên hình ảnh, sinh mô tả ảnh và tương tác hội thoại trong một ứng dụng web có kiểm soát. Mục đích của hệ thống là phục vụ học tập, nghiên cứu và trình diễn, không phải cung cấp một sản phẩm y tế thương mại.

Ảnh y tế có thể chứa thông tin trực quan phức tạp, khó khảo sát đầy đủ nếu chỉ sử dụng một nhãn phân loại cố định. Người dùng có thể cần đặt câu hỏi cụ thể, yêu cầu mô tả tổng quát hoặc tiếp tục trao đổi về cùng một hình ảnh. Dự án hỗ trợ các hoạt động này và tổ chức kết quả theo phiên trò chuyện gắn với tài khoản đã xác thực.

Ứng dụng hiện tại cung cấp tài khoản người dùng, trò chuyện dựa trên hình ảnh, lịch sử phiên, chức năng quản trị, số liệu phân tích và cấu hình nhà cung cấp AI hội thoại. Giao diện React trong mã nguồn hiện tại được xem là nguồn thông tin chính xác; các tài liệu cũ mô tả frontend bằng Streamlit đã lỗi thời.

Trong tài liệu này, hệ thống được phân loại là **ứng dụng trình diễn phục vụ giáo dục và nghiên cứu**. Hệ thống không phải công cụ chẩn đoán đã được kiểm định lâm sàng, không phải thiết bị y tế được cấp phép và không thay thế đánh giá của nhân viên y tế có chuyên môn.

### 1.2 Mục đích

Dự án cung cấp một nền tảng học thuật cho phép người dùng đã xác thực tải ảnh lên, đặt câu hỏi liên quan đến ảnh, nhận mô tả được sinh tự động, tiếp tục hội thoại theo luồng, xem lại các phiên trước và quản lý hồ sơ cá nhân. Quản trị viên có thể quản lý tài khoản, xem xét phiên trò chuyện, theo dõi số liệu hoạt động và cấu hình nhà cung cấp AI hội thoại. Các chức năng quản trị này phục vụ việc vận hành đồ án đại học, không đại diện cho hoạt động kinh doanh thương mại.

### 1.3 Mục tiêu

| Mã mục tiêu | Mục tiêu | Giá trị đối với người dùng/học thuật | Chỉ báo chấp nhận |
|---|---|---|---|
| OBJ-01 | Hỗ trợ hỏi đáp trực quan trên ảnh y tế. | Minh họa việc xử lý kết hợp hình ảnh và ngôn ngữ. | Yêu cầu ảnh–câu hỏi hợp lệ trả về câu trả lời hoặc lỗi có kiểm soát. |
| OBJ-02 | Sinh mô tả cho ảnh y tế. | Minh họa khả năng chuyển đổi từ hình ảnh sang văn bản. | Ảnh hợp lệ trả về mô tả hoặc lỗi có kiểm soát. |
| OBJ-03 | Cung cấp tương tác hội thoại với hình ảnh. | Cho phép người dùng khảo sát tiếp qua nhiều lượt trao đổi. | Một lượt trò chuyện hợp lệ hiển thị phản hồi dần theo luồng. |
| OBJ-04 | Lưu trữ lịch sử có tổ chức. | Cho phép xem lại các tương tác học thuật trước đó. | Người dùng mở lại phiên thuộc sở hữu và xem được tin nhắn đã lưu. |
| OBJ-05 | Bảo vệ quyền truy cập. | Giảm nguy cơ truy cập trái phép vào tài khoản và phiên. | Các quy tắc xác thực, vai trò và quyền sở hữu được thực thi. |
| OBJ-06 | Hỗ trợ quản trị có kiểm soát. | Cho phép vận hành môi trường trình diễn. | Quản trị viên truy cập được các chức năng quản lý đã phê duyệt. |
| OBJ-07 | Thông báo rõ lỗi và giới hạn. | Tránh làm cho đầu vào không hợp lệ hoặc AI chưa sẵn sàng trông như đã thành công. | Lỗi được thông báo rõ và không tạo kết quả thành công giả. |
| OBJ-08 | Hỗ trợ trình diễn học thuật có thể lặp lại. | Giúp nhóm và giảng viên hiểu các điều kiện tiên quyết. | Các tệp mô hình bên ngoài và giả định vận hành được tài liệu hóa. |

## 2. Phát biểu bài toán

Các nguyên mẫu xử lý ảnh thường chỉ được cung cấp dưới dạng những lần gọi mô hình riêng lẻ. Cách tiếp cận này không hỗ trợ đầy đủ quyền truy cập theo tài khoản, hội thoại liên tục, lịch sử có tổ chức hoặc phân tách hoạt động người dùng và quản trị viên. Những giới hạn của hệ thống cũng có thể không được truyền đạt nhất quán.

CV-VQA-MEDICAL giải quyết nhu cầu về một giao diện thống nhất và có kiểm soát, nơi người dùng có thể gửi ảnh, đặt câu hỏi bằng ngôn ngữ tự nhiên, nhận mô tả và tiếp tục trao đổi về hình ảnh. Người dùng hiện tại gồm người dùng học thuật khảo sát hệ thống và quản trị viên vận hành môi trường trình diễn.

Hệ thống mong muốn phải kiểm tra đầu vào, thực hiện chức năng phân tích ảnh đang khả dụng, trình bày rõ kết quả hoặc lỗi, lưu lịch sử phù hợp và ngăn người dùng thông thường truy cập phiên của người khác. Hệ thống không được trình bày nội dung sinh tự động như một kết luận chẩn đoán đã được xác nhận.

Ranh giới hệ thống bao gồm xác thực, hồ sơ, đầu vào ảnh, VQA, sinh mô tả, phiên hội thoại, quản trị, phân tích hoạt động và cấu hình nhà cung cấp. Phạm vi không bao gồm chẩn đoán lâm sàng, quyết định điều trị, quy trình bệnh viện, tích hợp hồ sơ bệnh án, phê duyệt pháp lý hoặc tuân thủ dữ liệu y tế đã được chứng minh.

## 3. Các bên liên quan

| Bên liên quan | Phân loại | Vai trò và mối quan tâm | Kỳ vọng | Lo ngại chính |
|---|---|---|---|---|
| Người dùng đã đăng ký | Trực tiếp hiện tại | Sử dụng phân tích ảnh, trò chuyện, lịch sử và hồ sơ. | Tương tác rõ ràng và truy cập được lịch sử thuộc sở hữu. | Kết quả sai, riêng tư, khả dụng, dễ sử dụng. |
| Quản trị viên | Trực tiếp hiện tại | Quản lý tài khoản, phiên, phân tích và nhà cung cấp. | Kiểm soát truy cập và phản hồi quản lý rõ ràng. | Truy cập trái phép, nội dung nhạy cảm, thông tin xác thực. |
| Nhóm dự án | Gián tiếp hiện tại | Phát triển và trình diễn đồ án. | Báo cáo nhất quán với mã nguồn và có thể tái hiện. | Thiếu điều kiện tiên quyết, tuyên bố không có căn cứ. |
| Giảng viên/người đánh giá | Gián tiếp hiện tại | Đánh giá mục tiêu học thuật và hành vi đã thực hiện. | Bằng chứng có thể truy vết, đúng phạm vi. | Tuyên bố lâm sàng quá mức hoặc phạm vi không rõ. |
| Người vận hành hệ thống | Gián tiếp hiện tại | Cung cấp cấu hình, tệp mô hình và duy trì khả dụng. | Trạng thái sẵn sàng và lỗi có thể nhận biết. | Phụ thuộc dịch vụ, phần cứng, sao lưu, bí mật. |
| Bác sĩ/chuyên gia chẩn đoán hình ảnh | Giả định/tương lai | Có thể đánh giá chuyên môn hoặc sử dụng phiên bản đã kiểm định trong tương lai. | Phạm vi phương thức ảnh và giới hạn được xác nhận. | Độ chính xác, thiên lệch, trách nhiệm, bảo mật. |
| Bệnh nhân/cơ sở y tế | Tương lai | Có thể trở thành chủ thể dữ liệu hoặc đơn vị sử dụng trong tương lai. | Đồng thuận, riêng tư, quản trị và tuân thủ. | Rò rỉ dữ liệu, lạm dụng, quyết định không an toàn. |
| Nhà cung cấp AI bên ngoài | Gián tiếp hiện tại | Cung cấp khả năng AI hội thoại đã cấu hình. | Yêu cầu tương thích và được ủy quyền. | Tính khả dụng, dữ liệu truyền đi, thông tin xác thực. |

## 4. Người dùng mục tiêu

### 4.1 Người dùng chính

Vai trò phân quyền chính đã được xác minh là **`user`**. Vai trò này đại diện cho người dùng học thuật đã xác thực, có kiến thức cơ bản về ứng dụng web và đủ bối cảnh để đặt câu hỏi về ảnh. Các hoạt động điển hình gồm đăng ký, đăng nhập, chọn phiên, tải ảnh, đặt câu hỏi, xem phản hồi theo luồng, xem lại lịch sử và chỉnh sửa hồ sơ. Người dùng thông thường chỉ được truy cập các phiên thuộc sở hữu của mình.

Vai trò này không chứng minh người dùng là bác sĩ, chuyên gia chẩn đoán hình ảnh, bệnh nhân hoặc nhân viên bệnh viện. Các nhãn “Clinical user”, “Radiologist” và trường chuyên môn trên giao diện chỉ là văn bản hiển thị hoặc dữ liệu hồ sơ, không phải vai trò phân quyền.

### 4.2 Người dùng thứ cấp

Vai trò thứ cấp đã được xác minh là **`admin`**. Quản trị viên có thể thực hiện các hoạt động của người dùng thông thường, đồng thời quản lý trạng thái tài khoản, xem phiên của nhiều người dùng, theo dõi số liệu phân tích và cấu hình nhà cung cấp. Vì vai trò này có thể truy cập nội dung trò chuyện, phạm vi sử dụng quyền quản trị cần có chính sách quản trị dữ liệu được phê duyệt.

### 4.3 Người dùng tương lai

Bác sĩ, chuyên gia chẩn đoán hình ảnh, giảng viên, bệnh nhân và nhân viên bệnh viện chỉ là nhóm người dùng tiềm năng trong tương lai. Việc hỗ trợ các nhóm này cần những yêu cầu riêng về lâm sàng, quyền riêng tư, an toàn và khả dụng.

## 5. Yêu cầu nghiệp vụ

| Mã BR | Yêu cầu nghiệp vụ | Lý do | Ưu tiên | Tiêu chí chấp nhận | Trạng thái bằng chứng |
|---|---|---|---|---|---|
| BR-01 | Nền tảng phải cung cấp đăng ký, xác thực, gia hạn truy cập, đăng xuất và đổi mật khẩu. | Bảo đảm truy cập liên tục nhưng có kiểm soát. | Must | Tài khoản hợp lệ, đang hoạt động được vào khu vực bảo vệ; truy cập sai bị từ chối. | Đã triển khai |
| BR-02 | Nền tảng phải phân biệt quyền `user` và `admin`. | Ngăn quản trị trái phép. | Must | Người dùng thường không thực hiện được thao tác chỉ dành cho quản trị viên. | Đã triển khai |
| BR-03 | Người dùng phải có thể quản lý thông tin hồ sơ được phép và ảnh đại diện. | Hỗ trợ nhận diện trong môi trường học thuật. | Should | Dữ liệu đã lưu xuất hiện khi mở lại hồ sơ. | Đã triển khai |
| BR-04 | Ảnh phải được kiểm tra trước khi phân tích. | Ngăn xử lý đầu vào không hợp lệ hoặc quá lớn. | Must | Tệp không phải ảnh, ảnh hỏng hoặc quá dung lượng bị từ chối rõ ràng. | Đã triển khai |
| BR-05 | Yêu cầu ảnh–câu hỏi hợp lệ phải được xử lý VQA khi chức năng sẵn sàng. | VQA là mục tiêu chính của dự án. | Must | Trả về câu trả lời cùng độ tin cậy khả dụng hoặc lỗi có kiểm soát. | Đã triển khai; trang riêng chưa được định tuyến |
| BR-06 | Ảnh hợp lệ phải được sinh mô tả khi chức năng sẵn sàng. | Minh họa chuyển đổi ảnh sang văn bản. | Must | Trả về mô tả hoặc lỗi có kiểm soát. | Đã triển khai; trang riêng chưa được định tuyến |
| BR-07 | Nền tảng phải hỗ trợ hội thoại nhiều lượt và phản hồi theo luồng. | Hỗ trợ khảo sát tiếp và cung cấp trạng thái xử lý. | Should | Một lượt hợp lệ hiển thị dần nội dung hoặc trạng thái công cụ. | Đã triển khai |
| BR-08 | Nền tảng phải lưu lịch sử phiên thuộc sở hữu người dùng. | Cho phép xem lại hoạt động học thuật. | Must | Có thể mở lại phiên thuộc sở hữu và xem tin nhắn đã lưu. | Đã triển khai |
| BR-09 | Người dùng phải có thể tạo, chọn, ghim, tiếp tục và xóa phiên thuộc sở hữu. | Cho phép tổ chức công việc. | Must | Mọi thao tác chỉ ảnh hưởng phiên thuộc sở hữu. | Đã triển khai |
| BR-10 | Quản trị viên phải có thể liệt kê, đặt lại mật khẩu, kích hoạt và vô hiệu hóa tài khoản phù hợp. | Hỗ trợ vận hành có kiểm soát. | Must | Thao tác hợp lệ cập nhật trạng thái; tự vô hiệu hóa bị từ chối. | Backend đã có; UI chính còn một phần |
| BR-11 | Quản trị viên phải có thể xem và xóa phiên theo chính sách đã phê duyệt. | Hỗ trợ giám sát. | Should | Quản trị viên truy cập được; người dùng thường bị từ chối. | Đã triển khai; chính sách chưa rõ |
| BR-12 | Quản trị viên phải xem được các số liệu hoạt động hiện có. | Hỗ trợ đánh giá học thuật và vận hành. | Should | Số liệu tổng hợp chỉ hiển thị cho quản trị viên. | Đã triển khai |
| BR-13 | Quản trị viên phải quản lý và kiểm tra nhà cung cấp AI mà không nhận lại khóa bí mật dạng rõ. | Kiểm soát việc sử dụng nhà cung cấp. | Must | Có thể quản lý/kiểm tra nhà cung cấp; bí mật trả về được che. | Chức năng đã có; bảo vệ khi lưu chưa nhất quán |
| BR-14 | Nền tảng phải thông báo rõ đầu vào sai, truy cập trái phép, chức năng chưa sẵn sàng và lỗi xử lý. | Không để lỗi giống một kết quả AI thành công. | Must | Mỗi lỗi liên quan trả về phản hồi dễ hiểu và có kiểm soát. | Đã triển khai |
| BR-15 | Đầu ra AI phải được trình bày là nội dung học thuật tham khảo, không phải chẩn đoán hoặc tư vấn y tế. | Nội dung sinh có thể sai hoặc thiếu. | Must | Cảnh báo giới hạn luôn hiển thị khi tương tác và xem kết quả. | Prompt hỗ trợ một phần; cảnh báo UI còn đề xuất |
| BR-16 | Quy tắc truy cập, lưu giữ và xóa phải bao phủ tài khoản, tin nhắn, ảnh, dữ liệu tạm, phân tích và nhật ký. | Nội dung liên quan y tế có thể nhạy cảm. | Must | Chính sách vòng đời được phê duyệt cho mọi loại dữ liệu. | Quyền sở hữu/xóa có một phần; chính sách còn đề xuất |
| BR-17 | Thông tin xác thực nhà cung cấp phải được bảo vệ nhất quán khi lưu và che trên phản hồi. | Ngăn lộ bí mật. | Must | Mọi bí mật được lưu bằng cơ chế bảo vệ đã phê duyệt. | Đã che phản hồi; cần sửa cơ chế lưu |
| BR-18 | Phương thức ảnh, ngôn ngữ hỗ trợ và độ bất định phải được công bố. | Chấp nhận tệp ảnh chung không chứng minh độ tin cậy chuyên ngành. | Must | Trường hợp không hỗ trợ bị từ chối hoặc gắn nhãn rõ. | Đề xuất; cần nhóm xác nhận |

## 6. Yêu cầu chức năng

| Mã FR | Yêu cầu chức năng | Tác nhân | Kết quả mong đợi | Ưu tiên | Trạng thái |
|---|---|---|---|---|---|
| FR-01 | Hệ thống phải đăng ký tài khoản với tên người dùng duy nhất, email hợp lệ duy nhất và mật khẩu hợp lệ. | Khách | Tạo tài khoản hoặc báo lỗi kiểm tra. | Must | Đã triển khai |
| FR-02 | Hệ thống phải xác thực tài khoản đang hoạt động và gia hạn truy cập bằng thông tin hợp lệ, chưa bị thu hồi. | User/admin | Cấp quyền hoặc từ chối. | Must | Đã triển khai |
| FR-03 | Hệ thống phải thu hồi thông tin xác thực hợp lệ được gửi khi đăng xuất trong thời gian hiệu lực còn lại. | User/admin | Xác nhận đăng xuất. | Must | Đã triển khai |
| FR-04 | Hệ thống phải bắt buộc đổi mật khẩu sau khi quản trị viên đặt lại. | User/admin | Đổi mật khẩu hoặc tiếp tục hạn chế truy cập. | Must | Đã triển khai |
| FR-05 | Hệ thống phải thực thi quyền `user` và `admin`. | User/admin | Kết quả được phép hoặc phản hồi cấm. | Must | Đã triển khai |
| FR-06 | Hệ thống phải cho phép xem/sửa trường hồ sơ được phép và ảnh đại diện hợp lệ. | User/admin | Hồ sơ cập nhật hoặc lỗi. | Should | Đã triển khai |
| FR-07 | Hệ thống phải cho phép tạo, liệt kê, chọn, ghim, xem, tiếp tục và xóa phiên thuộc sở hữu. | User/admin | Trạng thái phiên được cập nhật. | Must | Đã triển khai |
| FR-08 | Hệ thống phải ngăn người dùng thường truy cập phiên của người khác. | User | Từ chối truy cập. | Must | Đã triển khai |
| FR-09 | Hệ thống phải chấp nhận văn bản, ảnh hợp lệ hoặc cả hai trong lượt chat và từ chối yêu cầu trống. | User/admin | Chấp nhận lượt chat hoặc báo lỗi. | Must | Đã triển khai |
| FR-10 | Hệ thống phải kiểm tra loại ảnh, dung lượng cấu hình và khả năng giải mã. | User/admin | Chấp nhận hoặc từ chối ảnh. | Must | Đã triển khai |
| FR-11 | Hệ thống phải trả lời câu hỏi hợp lệ về ảnh hợp lệ khi VQA sẵn sàng. | User/admin | Câu trả lời/độ tin cậy hoặc lỗi. | Must | Đã triển khai; UI riêng còn một phần |
| FR-12 | Hệ thống phải sinh mô tả cho ảnh hợp lệ khi captioning sẵn sàng. | User/admin | Mô tả hoặc lỗi. | Must | Đã triển khai; UI riêng còn một phần |
| FR-13 | Hệ thống phải hiển thị dần nội dung hội thoại và sự kiện công cụ. | User/admin | Phản hồi theo luồng hoặc lỗi. | Should | Đã triển khai |
| FR-14 | Hệ thống phải lưu tin nhắn, tham chiếu ảnh, tiêu đề, thời gian và quyền sở hữu. | User/admin | Lịch sử có thể mở lại. | Must | Đã triển khai |
| FR-15 | Hệ thống phải xóa phiên chat và các ảnh chat liên quan khi thao tác xóa thành công. | User/admin | Phiên/lịch sử được loại bỏ. | Must | Đã triển khai |
| FR-16 | Hệ thống phải cho phép admin liệt kê, kích hoạt, vô hiệu hóa và đặt lại tài khoản phù hợp. | Admin | Trạng thái cập nhật hoặc lỗi. | Must | Backend đã có; UI còn một phần |
| FR-17 | Hệ thống phải cho phép admin liệt kê, xem, lọc và xóa phiên của nhiều người dùng. | Admin | Thông tin hoặc kết quả xóa. | Should | Đã triển khai |
| FR-18 | Hệ thống chỉ cung cấp số liệu hoạt động cho admin. | Admin | Số liệu tổng hợp hoặc từ chối. | Should | Đã triển khai |
| FR-19 | Hệ thống phải cho phép admin quản lý, chọn, kiểm tra và truy vấn nhà cung cấp, đồng thời che thông tin xác thực. | Admin | Kết quả nhà cung cấp/mô hình/kết nối. | Must | Bảo mật mới triển khai một phần |
| FR-20 | Hệ thống phải phân biệt trạng thái hoạt động cơ bản và trạng thái sẵn sàng phân tích ảnh. | Người vận hành | Trạng thái rõ ràng. | Must | Đã triển khai |
| FR-21 | Hệ thống phải hiển thị thường trực cảnh báo phi chẩn đoán và giới hạn sử dụng cùng tương tác/đầu ra AI. | User/admin | Cảnh báo giới hạn nhìn thấy được. | Must | Đề xuất; hiện chỉ có trong prompt |

Khôi phục mật khẩu khi quên chưa được triển khai. Giao diện có liên kết hiển thị nhưng không có quy trình khôi phục được kết nối.

## 7. Yêu cầu phi chức năng

Tài liệu không tự đặt ra giá trị số cho thời gian phản hồi, độ sẵn sàng, độ chính xác hoặc năng lực tải. Khi cần, các ngưỡng này phải được nhóm dự án phê duyệt.

| Mã NFR | Nhóm | Yêu cầu | Lý do đối với người dùng/dự án | Trạng thái bằng chứng/chỉ tiêu |
|---|---|---|---|---|
| NFR-01 | Khả dụng | Biểu mẫu, chọn ảnh, tiến trình, lịch sử và lỗi phải dễ hiểu mà không cần kiến thức kỹ thuật chuyên sâu. | Người dùng cần hoàn thành luồng chính mà không phải hiểu nội bộ hệ thống. | Đã có một phần; chưa xác định chỉ tiêu. |
| NFR-02 | Hiệu năng | Hệ thống phải cung cấp phản hồi tiến trình và tránh xử lý lặp không cần thiết khi được hỗ trợ. | Người dùng cần nhận biết tiến trình và có trải nghiệm lặp hợp lý. | Hành vi liên quan đã có; chưa có ngưỡng thời gian. |
| NFR-03 | Tin cậy | Đầu vào sai và AI chưa sẵn sàng không được tạo kết quả thành công giả. | Lỗi có kiểm soát an toàn hơn đầu ra gây hiểu nhầm. | Đã triển khai. |
| NFR-04 | Sẵn sàng | Người vận hành phải xác định được ứng dụng có sẵn sàng phân tích ảnh hay không. | Không nên bắt đầu trình diễn khi chức năng cần thiết chưa sẵn sàng. | Đã triển khai; chưa có mục tiêu độ sẵn sàng. |
| NFR-05 | Bảo mật | Thao tác bảo vệ phải yêu cầu xác thực hợp lệ, tài khoản hoạt động, đúng vai trò và quyền sở hữu phiên. | Tài khoản và nội dung người dùng cần được kiểm soát. | Đã triển khai; chưa có chuẩn bảo mật chính thức. |
| NFR-06 | Riêng tư | Ảnh, tin nhắn, hồ sơ, nhật ký và phân tích nhạy cảm phải theo chính sách truy cập, lưu giữ, xóa và tiết lộ đã duyệt. | Nội dung y tế có thể chứa thông tin nhạy cảm. | Đề xuất; chưa xác định thời hạn lưu. |
| NFR-07 | Bảo trì | Tài liệu yêu cầu phải nhất quán với hành vi hiện tại mà người dùng nhìn thấy. | Không nhất quán làm giảm chất lượng báo cáo học thuật. | Yêu cầu suy luận. |
| NFR-08 | Mở rộng | Thay đổi năng lực trong tương lai không được làm thay đổi hợp đồng hành vi người dùng khi chưa duyệt yêu cầu. | Mở rộng phải giữ kỳ vọng sử dụng. | Suy luận; chưa có mục tiêu tải. |
| NFR-09 | Tương thích | Ứng dụng phải hoạt động trên trình duyệt hiện đại và định dạng ảnh được nhóm phê duyệt. | Người dùng và giảng viên cần môi trường tương thích xác định. | Có bằng chứng Chromium; ma trận đầy đủ chưa xác nhận. |
| NFR-10 | Khả chuyển | Dự án phải trình diễn được trên môi trường hỗ trợ đã tài liệu hóa khi có đủ điều kiện bên ngoài. | Đồ án cần lặp lại được ngoài máy của một lập trình viên. | Tài liệu một phần; môi trường chưa xác nhận. |
| NFR-11 | Tiếp cận | Chức năng xác thực, ảnh, lịch sử, hồ sơ và quản trị cốt lõi phải dùng được bằng bàn phím và có nhãn có nghĩa. | Luồng chính không nên phụ thuộc hoàn toàn vào chuột hoặc biểu tượng. | Đã có một phần; chưa xác định mức tiếp cận. |
| NFR-12 | An toàn | Trạng thái phi chẩn đoán, phạm vi hỗ trợ, độ bất định và yêu cầu đánh giá chuyên môn phải được thông báo nhất quán. | Tránh người dùng phụ thuộc quá mức vào nội dung sinh. | Đề xuất; prompt hỗ trợ một phần. |
| NFR-13 | Minh bạch vận hành | Người vận hành phải nhận đủ trạng thái và lỗi để biết chức năng bắt buộc không khả dụng. | Vận hành học thuật có kiểm soát cần trạng thái lỗi rõ. | Đã triển khai; chưa có tiêu chí leo thang. |
| NFR-14 | Tái lập | Phụ thuộc, cấu hình, nguồn gốc mô hình và giả định trình diễn phải được tài liệu hóa mà không lộ bí mật thật. | Công việc cần có thể lặp lại và đánh giá. | Đạt một phần; thiếu trọng số mô hình. |

## 8. Câu chuyện người dùng

| Mã | Câu chuyện người dùng | Ưu tiên | Trạng thái |
|---|---|---|---|
| US-01 | Là khách, tôi muốn đăng ký để truy cập chức năng phân tích ảnh được bảo vệ. | Must | Đã triển khai |
| US-02 | Là người dùng, tôi muốn đăng nhập và gia hạn truy cập để tiếp tục sử dụng hợp lệ. | Must | Đã triển khai |
| US-03 | Là người dùng, tôi muốn đăng xuất để thông tin xác thực hiện tại bị thu hồi. | Must | Đã triển khai |
| US-04 | Là người dùng vừa được đặt lại mật khẩu, tôi muốn đổi mật khẩu để chỉ mình tôi biết mật khẩu mới. | Must | Đã triển khai |
| US-05 | Là người dùng, tôi muốn sửa hồ sơ và ảnh đại diện để phản ánh thông tin của mình. | Should | Đã triển khai |
| US-06 | Là người dùng, tôi muốn ảnh sai bị từ chối rõ ràng để có thể sửa đầu vào. | Must | Đã triển khai |
| US-07 | Là người dùng, tôi muốn đặt câu hỏi về ảnh để khảo sát thông tin trực quan. | Must | Đã triển khai |
| US-08 | Là người dùng, tôi muốn nhận mô tả ảnh để có phần mô tả ban đầu. | Must | Đã triển khai; trang riêng còn một phần |
| US-09 | Là người dùng, tôi muốn phản hồi theo luồng để biết quá trình xử lý đang tiếp tục. | Should | Đã triển khai |
| US-10 | Là người dùng, tôi muốn mở lại phiên để duy trì bối cảnh. | Must | Đã triển khai |
| US-11 | Là người dùng, tôi muốn xóa phiên và ảnh thuộc sở hữu để kiểm soát lịch sử. | Must | Đã triển khai cho chat |
| US-12 | Là admin, tôi muốn quản lý tài khoản để kiểm soát quyền truy cập. | Must | Backend đã có; UI còn một phần |
| US-13 | Là admin, tôi muốn xem phiên để hỗ trợ vận hành có quản trị. | Should | Đã triển khai; chính sách chưa rõ |
| US-14 | Là admin, tôi muốn xem số liệu hoạt động để hiểu việc sử dụng hệ thống. | Should | Đã triển khai |
| US-15 | Là admin, tôi muốn cấu hình/kiểm tra nhà cung cấp để dùng dịch vụ đã phê duyệt. | Must | Bảo mật mới một phần |
| US-16 | Là người dùng, tôi muốn thấy lỗi và giới hạn để không nhầm đầu ra với sự thật y khoa. | Must | Đã triển khai một phần |

## 9. Ca sử dụng

| Mã UC | Ca sử dụng | Tác nhân | Điều kiện trước | Luồng chính | Ngoại lệ | Điều kiện sau | Trạng thái |
|---|---|---|---|---|---|---|---|
| UC-01 | Đăng ký tài khoản | Khách | Chưa xác thực | Gửi tên, email, mật khẩu; kiểm tra; tạo `user`; xác thực. | Dữ liệu sai/trùng bị từ chối. | Có tài khoản/quyền truy cập hoặc không tạo gì khi lỗi. | Đã triển khai |
| UC-02 | Xác thực, đổi mật khẩu hoặc đăng xuất | User/admin | Tài khoản hoạt động; phiên xác thực cho đổi mật khẩu/đăng xuất | Gửi thông tin đăng nhập; nhận quyền; đổi mật khẩu tạm nếu cần; đăng xuất khi xong. | Thông tin sai, hết hạn, vô hiệu hoặc bị thu hồi bị từ chối. | Tác nhân vào hệ thống, đổi mật khẩu, kết thúc phiên hoặc vẫn chưa xác thực. | Đã triển khai |
| UC-03 | Tạo/chọn phiên | User/admin | Đã xác thực | Liệt kê phiên thuộc sở hữu; tạo/chọn; hiển thị lịch sử. | Phiên thiếu/không thuộc sở hữu bị từ chối. | Một phiên thuộc sở hữu đang hoạt động. | Đã triển khai |
| UC-04 | Tải ảnh | User/admin | Đã mở tương tác phù hợp | Chọn ảnh; kiểm tra loại, dung lượng, giải mã; chấp nhận xử lý. | Tệp sai, quá lớn hoặc hỏng bị từ chối. | Ảnh hợp lệ tiếp tục hoặc không phân tích. | Đã triển khai; chưa rõ phương thức ảnh |
| UC-05 | Hỏi về ảnh | User/admin | Ảnh/câu hỏi hợp lệ; VQA sẵn sàng | Gửi và kiểm tra yêu cầu; thực hiện VQA; trình bày câu trả lời và độ tin cậy khả dụng. | Câu hỏi trống/dài, thiếu ảnh, mô hình chưa sẵn sàng hoặc lỗi được báo. | Hiển thị câu trả lời hoặc lỗi có kiểm soát. | Đã triển khai; trang riêng còn một phần |
| UC-06 | Sinh mô tả ảnh | User/admin | Ảnh hợp lệ; captioning sẵn sàng | Gửi và kiểm tra ảnh; sinh và trình bày mô tả. | Ảnh sai, mô hình chưa sẵn sàng hoặc lỗi được báo. | Hiển thị mô tả hoặc lỗi có kiểm soát. | Đã triển khai; trang riêng còn một phần |
| UC-07 | Tiếp tục/xóa lịch sử | User/admin | Có phiên thuộc sở hữu | Kiểm tra sở hữu; hiển thị lịch sử; tiếp tục, ghim hoặc xóa. | Phiên thiếu/không thuộc sở hữu bị từ chối. | Lịch sử giữ nguyên/mở rộng hoặc bị xóa cùng ảnh chat. | Đã triển khai |
| UC-08 | Cập nhật hồ sơ | User/admin | Đã xác thực | Sửa trường/ảnh đại diện; kiểm tra; lưu; hiển thị lại. | Ảnh đại diện sai hoặc lỗi dịch vụ được báo. | Hồ sơ cập nhật hoặc giữ nguyên khi lỗi. | Đã triển khai |
| UC-09 | Quản lý tài khoản | Admin | Admin đang hoạt động | Liệt kê; kích hoạt, vô hiệu hóa hoặc đặt lại tài khoản. | Không phải admin, thiếu tài khoản hoặc tự vô hiệu hóa bị từ chối. | Trạng thái cập nhật hoặc giữ nguyên. | Backend đã có; UI còn một phần |
| UC-10 | Xem phiên và phân tích | Admin | Admin hoạt động và có chính sách cho phép | Mở màn hình; lọc; xem số liệu hoặc phiên; có thể xóa phiên. | Mã sai, dữ liệu không có hoặc không phải admin bị từ chối. | Thông tin được xem; phiên chọn có thể bị xóa. | Đã triển khai; chính sách chưa rõ |
| UC-11 | Cấu hình nhà cung cấp | Admin | Có thông tin nhà cung cấp đã duyệt | Tạo/sửa; chọn mặc định; kiểm tra; lấy mô hình; che bí mật trả về. | Trùng, sai, không kết nối hoặc xóa mặc định bị từ chối. | Nhà cung cấp khả dụng hoặc giữ trạng thái trước. | Chức năng đã có; cần sửa bảo vệ khi lưu |

## 10. Phạm vi dự án

### 10.1 Trong phạm vi

| Khả năng | Trạng thái |
|---|---|
| Xác thực và đổi mật khẩu | Đã triển khai |
| Vai trò `user` và `admin` | Đã triển khai |
| Quản lý hồ sơ/ảnh đại diện | Đã triển khai |
| Chat ảnh y tế và phản hồi theo luồng | Đã triển khai |
| VQA và sinh mô tả ảnh | Đã triển khai; trang riêng còn một phần |
| Lịch sử phiên và thao tác phiên người dùng | Đã triển khai |
| Quản trị người dùng/phiên | Đã triển khai; một số thao tác UI còn thiếu |
| Phân tích dành cho quản trị viên | Đã triển khai |
| Cấu hình nhà cung cấp AI | Đã triển khai nhưng còn khoảng trống bảo vệ bí mật |
| Trạng thái hoạt động, sẵn sàng và phản hồi lỗi | Đã triển khai |

### 10.2 Ngoài phạm vi

| Khả năng | Quyết định phạm vi |
|---|---|
| Chẩn đoán, điều trị hoặc quyết định y tế tự động | Không hỗ trợ |
| Quy trình bệnh viện, EHR hoặc PACS | Chưa triển khai |
| Quản lý danh tính và đồng thuận bệnh nhân | Chưa triển khai |
| Phê duyệt pháp lý | Chưa được thiết lập |
| Tuân thủ HIPAA/GDPR đã được chứng minh | Chưa được thiết lập |
| Ứng dụng di động gốc | Chưa triển khai |
| Giao diện huấn luyện mô hình/quản lý dữ liệu | Chưa triển khai |
| Quy trình bác sĩ phê duyệt chính thức | Chưa triển khai |
| Khôi phục mật khẩu/xác minh email | Chưa triển khai |

## 11. Ràng buộc

| Mã | Ràng buộc | Phân loại | Ảnh hưởng/hành động cần thiết |
|---|---|---|---|
| CON-01 | Thiếu trọng số VQA/caption trong repository. | Đã xác minh | Cần tệp ngoài được duyệt, nguồn gốc, kiểm tra toàn vẹn và giấy phép. |
| CON-02 | Tài nguyên mô hình tiền huấn luyện có thể cần nguồn ngoài. | Đã xác minh | Phải tài liệu hóa phiên bản tương thích được duyệt. |
| CON-03 | Phân tích ảnh phụ thuộc môi trường xử lý tương thích. | Đã xác minh | Phải xác nhận môi trường trình diễn mục tiêu. |
| CON-04 | Ảnh có giới hạn dung lượng cấu hình. | Đã xác minh | Phải hiển thị giới hạn đang áp dụng nhất quán. |
| CON-05 | Câu hỏi VQA trực tiếp có giới hạn độ dài. | Đã xác minh | Phải thông báo giới hạn đang áp dụng. |
| CON-06 | Phiên và ngữ cảnh AI gần đây có giới hạn. | Đã xác minh | Phải công bố hành vi khi phiên dài. |
| CON-07 | Không thực thi danh sách phương thức ảnh y tế hỗ trợ. | Khoảng trống xác minh | Cần phê duyệt và công bố phương thức hỗ trợ. |
| CON-08 | Kỳ vọng ngôn ngữ chưa nhất quán. | Cần nhóm xác nhận | Phải định nghĩa riêng ngôn ngữ cho VQA và chat. |
| CON-09 | Tài khoản, phiên, thu hồi truy cập và ảnh phụ thuộc dịch vụ hỗ trợ. | Đã xác minh | Cần chính sách sao lưu và vận hành suy giảm. |
| CON-10 | Chat đầy đủ cần nhà cung cấp tương thích. | Đã xác minh | Phải xác nhận yêu cầu dự phòng. |
| CON-11 | Bằng chứng trình duyệt chủ yếu cho Chromium. | Đã xác minh | Phải phê duyệt ma trận trình duyệt. |
| CON-12 | Không có kiểm định lâm sàng/phê duyệt pháp lý. | Đã xác minh | Duy trì phân loại học thuật phi chẩn đoán. |
| CON-13 | Cấu hình mẫu chứa giá trị mặc định không an toàn. | Đã xác minh | Thay thế trong môi trường dùng chung; không công khai giá trị. |
| CON-14 | README mâu thuẫn với frontend React hiện tại. | Đã xác minh | Mã nguồn là nguồn chính; sửa tài liệu cũ riêng. |

## 12. Rủi ro

| Mã | Rủi ro | Khả năng | Tác động | Giảm thiểu hiện có | Giảm thiểu cần thiết |
|---|---|---|---|---|---|
| RISK-01 | Câu trả lời/mô tả y tế sai | Cao | Nghiêm trọng | Kiểm tra đầu vào và độ tin cậy khả dụng | Đánh giá, ngưỡng, cảnh báo, xem xét chuyên môn |
| RISK-02 | LLM tạo thông tin không có căn cứ | Cao | Cao | Prompt yêu cầu dùng công cụ ảnh | Buộc gắn căn cứ và cơ chế từ chối |
| RISK-03 | Phương thức ảnh không hỗ trợ | Trung bình | Cao | Kiểm tra tệp cơ bản | Danh sách phương thức và thực thi |
| RISK-04 | Ngôn ngữ/câu hỏi không hỗ trợ | Trung bình | Cao | Kiểm tra trống/độ dài | Hợp đồng phạm vi hỗ trợ |
| RISK-05 | Nhà cung cấp gián đoạn | Trung bình | Cao | Kiểm tra kết nối/lỗi | Chế độ dự phòng hoặc suy giảm |
| RISK-06 | Thiếu trọng số mô hình | Cao | Cao | Trạng thái sẵn sàng | Phân phối và kiểm tra toàn vẹn |
| RISK-07 | Truy cập trái phép | Trung bình | Cao | Xác thực, vai trò, sở hữu | Rà soát bảo mật/giám sát |
| RISK-08 | Lộ ảnh y tế nhạy cảm | Cao | Nghiêm trọng | Xác thực, liên kết giới hạn, xóa phiên | Khử định danh, lưu giữ, kiểm toán |
| RISK-09 | Lộ thông tin xác thực | Trung bình | Nghiêm trọng | Che bí mật/mã hóa một phần | Quản lý bí mật và luân chuyển |
| RISK-10 | Lỗi dữ liệu/lưu trữ | Trung bình | Cao | Báo lỗi/trạng thái | Sao lưu, phục hồi, đối soát |
| RISK-11 | Đầu ra bị dùng như chẩn đoán | Cao | Nghiêm trọng | Cảnh báo trong prompt | Cảnh báo thường trực/chính sách sử dụng |
| RISK-12 | Tài liệu lỗi thời | Cao | Trung bình | Mã nguồn vẫn khả dụng | Một tài liệu chính được rà soát |
| RISK-13 | Ảnh suy luận trực tiếp bị bỏ mồ côi | Trung bình | Cao | Tên lưu trữ theo người dùng | Liên kết vòng đời hoặc không lưu |
| RISK-14 | Nhật ký chứa nội dung nhạy cảm | Trung bình | Cao | Chưa xác minh giảm thiểu chính thức | Che dữ liệu, giới hạn truy cập/lưu giữ |
| RISK-15 | Mã hóa bí mật nhà cung cấp không nhất quán | Trung bình | Nghiêm trọng | Che trên phản hồi | Mã hóa, di chuyển, luân chuyển |
| RISK-16 | Lỗi dịch vụ hỗ trợ ảnh hưởng thu hồi truy cập | Trung bình | Cao | Thông tin truy cập có hạn dùng | Chính sách an toàn khi lỗi và giám sát |
| RISK-17 | Tuyên bố tuân thủ/“medical-grade” không có căn cứ | Cao | Cao | Chưa có | Xóa hoặc chứng minh chính thức |

## 13. Công việc tương lai

Các nội dung sau là định hướng tương lai, không phải khả năng hiện có:

1. Xác nhận và thực thi danh sách phương thức ảnh y tế được hỗ trợ.
2. Đánh giá và công bố rõ hỗ trợ đa ngôn ngữ cho VQA và chat.
3. Bổ sung cơ chế từ chối và chuyển cấp dựa trên độ tin cậy.
4. Thêm cảnh báo an toàn phi chẩn đoán hiển thị thường trực.
5. Bổ sung quy trình chuyên gia lĩnh vực xem xét có quản trị.
6. Triển khai khôi phục mật khẩu và xác minh email.
7. Bổ sung xóa tài khoản, xuất dữ liệu và kiểm soát thời hạn lưu.
8. Mã hóa và quản trị nhất quán mọi bí mật nhà cung cấp.
9. Sửa tài liệu lỗi thời và duy trì khả năng truy vết.
10. Đánh giá chính thức với chuyên gia lĩnh vực và tài liệu hóa tập dữ liệu, giới hạn, trường hợp thất bại.
11. Chỉ xem xét tích hợp hệ thống giáo dục hoặc bệnh viện sau đánh giá quản trị riêng.
12. Chỉ bổ sung ứng dụng di động, công cụ huấn luyện hoặc quản lý dữ liệu dưới dạng phần mở rộng được phê duyệt riêng.

Mỗi nội dung tương lai cần có yêu cầu, đánh giá đạo đức, triển khai và đánh giá riêng trước khi được báo cáo là chức năng khả dụng.
