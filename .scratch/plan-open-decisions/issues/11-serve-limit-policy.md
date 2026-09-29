# D12b — Xử lý khách vượt khả năng phục vụ nếu tỉ lệ bỏ về vì đông quá cao

Type: grilling
Status: open
Blocked by: 10

## Question

PLAN §15 D12: "Xử lý khách vượt khả năng phục vụ (§3.8) nếu sim cho tỉ lệ bỏ về vì đông quá cao?" Phương án mặc định nếu "tuỳ bạn": **Báo cáo số liệu, chờ cơ chế nhân viên (PLAN §17 Backlog — thuê nhân viên, chưa làm ở bản đầu)**.

Chờ ticket 10 (chạy sim) ra số liệu thật. Nếu tỉ lệ `turnedAway` nằm trong khoảng chấp nhận được: giữ mặc định, chỉ ghi nhận. Nếu tỉ lệ cao bất thường: cần hỏi chủ dự án có muốn kéo tính năng nhân viên (PLAN §17) vào bản đầu sớm hơn dự kiến, hay chấp nhận tỉ lệ đó, hay điều chỉnh cân bằng khác (patience, queueMax, tốc độ khách đến) — đúng luật "Phải hỏi trước" của CLAUDE.md mục "Con số cân bằng game khi `npm run sim` cho kết quả nằm ngoài khoảng mục tiêu".
