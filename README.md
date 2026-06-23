# Documentation Hub

## Run the Application Locally

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- An [ngrok](https://ngrok.com/) account and the ngrok CLI

### 1. Clone the Frontend Repository

```bash
git clone https://github.com/luquocphap/Documentation-Hub-Frontend.git
cd Documentation-Hub-Frontend
```

### 2. Set Up ngrok

If you do not have an ngrok account or have not installed ngrok:

1. [Sign up or log in to ngrok](https://dashboard.ngrok.com/).
2. [Download and install the ngrok CLI](https://ngrok.com/download).
3. Verify the installation:

   ```bash
   ngrok help
   ```

4. Get your authtoken from the [ngrok Dashboard](https://dashboard.ngrok.com/get-started/your-authtoken), then configure it:

   ```bash
   ngrok config add-authtoken <YOUR_NGROK_AUTHTOKEN>
   ```

You only need to complete the registration, installation, and authtoken configuration once.

### 3. Expose the Backend Port with ngrok

Open a terminal and run:

```bash
ngrok http 3070
```

Copy the HTTPS URL displayed by ngrok and keep this terminal running while using the application.

### 4. Configure Environment Variables

Prepare the following two files in the repository root:

- `.env.fe` for the frontend.
- `.env.be` for the backend.

Do not rename these files. Configure their environment variables using the project's configuration details.

In `.env.be`, set `BACKEND_URL` to the HTTPS URL provided by ngrok.

The free ngrok URL may change whenever ngrok restarts. Update `BACKEND_URL` when necessary.

### 5. Start the Application

Open another terminal in the repository root and run:

```bash
docker compose up -d
```

After the containers start, open [http://localhost:5173](http://localhost:5173) in your browser.

Check the service status:

```bash
docker compose ps
```

Stop the application and remove its volumes:

```bash
docker compose down -v
```
