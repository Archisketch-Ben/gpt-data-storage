import express from 'express'
import bodyParser from 'body-parser'
import AWS from 'aws-sdk'
import cors from 'cors'
import 'dotenv/config'

const isProd = process.env.NODE_ENV === 'production'

const app = express()
app.use(
  cors({
    origin: isProd ? 'http://localhost:5173' : 'http://localhost:5173'
  })
)
const port = process.env.SERVER_PORT || 3000

app.use(bodyParser.json())

AWS.config.update({
  region: 'ap-northeast-2',
  credentials: new AWS.Credentials({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
  })
})

const dynamoDB = new AWS.DynamoDB.DocumentClient()

app.get('/api/diffusion-prompt-gathering', async (req, res) => {
  const params = {
    TableName: 'diffusion_prompt_gathering'
  }

  try {
    const data = await dynamoDB.scan(params).promise()
    res.send(data.Items)
  } catch (err) {
    console.error(`Error fetching data from DynamoDB: ${err}`)
    res.status(500).send(`Error fetching data from DynamoDB: ${err}`)
  }
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})
