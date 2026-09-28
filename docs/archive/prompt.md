ví có quá nhiều usecase sẽ phải giải quyết nên sẽ giới hạn lại cách hoạt động của game: những module như nhập tên, tạo thương hiệu, mô tả các thứ là cơ bản. Nhưng định hình của game sẽ là: "bạn là 1 genz nổi loạn, bạn thích tạo sự khác biệt và kiếm tiền từ đó, bạn nghĩ ra ý tưởng kinh doanh là bán các vé bay tối với giá ưu đãi hấp dẫn,...." phần còn lại bạn tự ghi cho hấp dẫn

nguồn tin tưởng sẽ là file này, nếu có gì conflict với plan.md thì hãy tin tưởng file này

quá nhiều nên tôi sẽ nói cho bạn nghe những gì tôi muốn và những vướng mắc:
- không giới hạn số khách 1 ngày, chỉ giới hạn thời gian làm việc từ 8:00-19:00, nhưng lượng khách vẫn tăng ngẫu nhiên theo từng ngày: nhưng những ngày đầu buộc phải số lượng khách tăng dần từ 5 dần lên các ngày cấp số +, mỗi ngày ngẫu nhiên + từ 1-3 khách cho 10 ngày đầu, sau ngày 10 sẽ mở khóa travelviet: 1 app để đánh giá hãng bay, lúc đó sẽ có đánh giá hãng bay, theo hạng 5 sao, sao càng cao càng nhiều khách, ở mức 1-3 sao lượng khách sẽ bị bóp đến cỡ không có gì chơi (đây là hình phạt), ở mốc 4-5 sao lượng khách sẽ tăng theo số thập phân, ví dụ 4.1 sẽ có thêm 7 khách mỗi ngày, 4.2 sẽ có 10, lượng khách sẽ random tăng dần, không giới hạn
- tôi không hiểu invariant 8.4 đang nói gì
- đúng
- các giao dịch đó sẽ tính vào ngày hôm sau để các vé sau mua không bị hết hạn ngay sau khi ấn nút qua ngày
- ko hiểu
- không hiẻu
- không hiểu

thiếu đặc tả:
- hiện tại chỉ là bán vé, chưa phát triển tính năng bay
- bỏ hoàn toàn chế độ thư giãn, chỉ có 1 chế độ mặc định của game là được, mặc định việc bán vé sẽ rất khắt khe
- cứ ghế sau giờ bay sẽ là ghế ế, tất cả các chuyến bay sẽ khởi hành lúc 9h30 cùng ngày
- giải thích rõ hơn §5.3 nói "doanh thu chỉ khi được chấm 'được' trở lên", nhưng §5.5 cho POOR doanh thu × 0.5.
- mỗi ngày sẽ có sự kiện ngẫu nhiên hoặc không, rằng sẽ có chuyến bị delay hoặc bị cancel và nếu nó bị cancel thì sẽ mất hết vé đã mua của chuyến đó ( đó là tính năng random cho vui)
- có tính maxComplexity vì đó là khách BUSINESS nên việc đơn của họ sẽ rất khắt khe, và rất khó tính, nếu hoàn thành xuất sắc đơn của họ sẽ được thưởng tip x0.8 giá vé
- theo ý bạn

các mục khác tôi cho phép bạn tùy ý để game hay hơn, nhưng có những quyết định về quy trình game tôi sẽ quyết định