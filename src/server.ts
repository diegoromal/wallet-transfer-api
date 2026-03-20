import { buildApp } from "./app";

const app = buildApp()

app.listen({ port: 3333, host: "0.0.0.0" })
.then(() => {
    console.log("HTTP server is running on port 3333")
})
.catch((error) => {
    console.error(error)
    process.exit(1)
})