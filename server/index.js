import express from 'express'
import bodyParser from 'body-parser'
import AWS from 'aws-sdk'
import cors from 'cors'
import 'dotenv/config'

const isProd = process.env.NODE_ENV === 'production'

const app = express()
app.use(
  cors({
    origin: isProd
      ? 'https://storied-muffin-f829de.netlify.app'
      : 'http://localhost:5173'
  })
)

const port = process.env.PORT || 5000

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

app.post('/api/diffusion-prompt-gathering', async (req, res) => {
  const { uuid, isSelected } = req.body

  const params = {
    TableName: 'diffusion_prompt_gathering',
    Key: {
      uuid
    },
    UpdateExpression: 'set isSelected = :isSelected',
    ExpressionAttributeValues: {
      ':isSelected': isSelected
    },
    ReturnValues: 'UPDATED_NEW'
  }

  try {
    await dynamoDB.update(params).promise()
    res.send('Success')
  } catch (err) {
    console.error(`Error updating data from DynamoDB: ${err}`)
    res.status(500).send(`Error updating data from DynamoDB: ${err}`)
  }
})

// FIXME: 병목 이슈로 사용하지 않음
// app.get('/api/fetch-image', async (req, res) => {
//   const { url } = req.query

//   try {
//     const { data } = await axios.get(url, {
//       responseType: 'arraybuffer'
//     })
//     const imageBuffer = Buffer.from(data, 'binary')

//     res.set({
//       'Content-Type': 'image/png',
//       'Content-Length': imageBuffer.length
//     })

//     res.send(imageBuffer)
//   } catch (err) {
//     console.error(`Error fetching image from ${url}: ${err}`)
//     res.status(500).send(`Error fetching image from ${url}: ${err}`)
//   }
// })

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})
