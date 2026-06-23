# Documentation Hub

## Chạy ứng dụng trên local

### Yêu cầu

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Tài khoản và CLI [ngrok](https://ngrok.com/)

### 1. Clone source frontend

```bash
git clone https://github.com/luquocphap/Documentation-Hub-Frontend.git
cd Documentation-Hub-Frontend
```

### 2. Thiết lập ngrok

Nếu chưa có tài khoản hoặc chưa cài ngrok:

1. [Đăng ký hoặc đăng nhập ngrok](https://dashboard.ngrok.com/).
2. [Tải và cài đặt ngrok CLI](https://ngrok.com/download).
3. Kiểm tra ngrok đã được cài đặt:

   ```bash
   ngrok help
   ```

4. Lấy authtoken tại [ngrok Dashboard](https://dashboard.ngrok.com/get-started/your-authtoken), sau đó cấu hình:

   ```bash
   ngrok config add-authtoken <YOUR_NGROK_AUTHTOKEN>
   ```

Các bước đăng ký, cài đặt và cấu hình authtoken chỉ cần thực hiện một lần.

### 3. Public cổng backend bằng ngrok

Mở một terminal và chạy:

```bash
ngrok http 3070
```

Sao chép HTTPS URL được ngrok hiển thị và giữ terminal này tiếp tục chạy trong suốt thời gian sử dụng ứng dụng.

### 4. Chuẩn bị biến môi trường

Tại thư mục gốc của source, chuẩn bị đúng hai file cấu hình:

- `.env.fe` cho frontend.
- `.env.be` cho backend.

Không đổi tên hai file này. Nội dung biến môi trường được cấu hình theo thông tin của dự án.

Trong file `.env.be`, điền HTTPS URL vừa nhận từ ngrok vào trường `BACKEND_URL`.

URL miễn phí có thể thay đổi sau mỗi lần khởi động lại ngrok, vì vậy hãy cập nhật lại `BACKEND_URL` khi cần.

### 5. Khởi động ứng dụng

Mở terminal khác tại thư mục source và chạy:

```bash
docker compose up -d
```

Sau khi các container khởi động, truy cập ứng dụng tại [http://localhost:5173](http://localhost:5173).

Kiểm tra trạng thái các service:

```bash
docker compose ps
```

Tắt ứng dụng:

```bash
docker compose down -v
```
