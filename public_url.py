from pyngrok import ngrok
import time

def main() -> None:
    """
    Mở public URL dùng ngrok cho localhost:3000.
    """
    ngrok.set_auth_token("TOKEN")

    # Tạo tunnel
    public_url = ngrok.connect(3000, "http")
    print(f"Public URL: {public_url.public_url}/home")

    # Giữ tiến trình chạy
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        ngrok.kill()

if __name__ == "__main__":
    main()
