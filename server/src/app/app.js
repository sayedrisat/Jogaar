import express from 'express'
import cookieParser from 'cookie-parser'
import router from '../routes/auth.routes.js'

let app = express()
app.use(express.json())
app.use(cookieParser())

app.use("/api/auth", router)

export default app;