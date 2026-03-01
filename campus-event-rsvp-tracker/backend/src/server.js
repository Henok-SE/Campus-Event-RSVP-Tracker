import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    service: 'campus-event-rsvp-tracker-backend',
    timestamp: new Date().toISOString(),
  })
})

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`)
})
