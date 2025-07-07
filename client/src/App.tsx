import { useState } from 'react'
import { MantineProvider, Container, Title, Paper, Text, LoadingOverlay } from '@mantine/core'
import { Dropzone } from '@mantine/dropzone'
import axios from 'axios'
import './App.css'

function App() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDrop = async (files: File[]) => {
    try {
      setLoading(true)
      setError(null)
      const file = files[0]
      
      const formData = new FormData()
      formData.append('document', file)

      const response = await axios.post('http://localhost:5002/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setResult(response.data)
    } catch (err) {
      setError('Error processing document. Please try again.')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <MantineProvider>
      <Container size="sm" py="xl">
        <Title order={1} align="center" mb="xl">
          Document Analysis System
        </Title>

        <Paper p="md" radius="md" withBorder>
          <Dropzone
            onDrop={handleDrop}
            accept={['image/*', 'application/pdf']}
            maxSize={5 * 1024 ** 2} // 5MB
            multiple={false}
          >
            <Text align="center" size="xl" mt="md">
              Drop your document here or click to select
            </Text>
            <Text align="center" size="sm" color="dimmed" mt="xs">
              Accepted formats: Images and PDF (max 5MB)
            </Text>
          </Dropzone>

          <LoadingOverlay visible={loading} />

          {error && (
            <Text color="red" align="center" mt="md">
              {error}
            </Text>
          )}

          {result && (
            <Paper mt="md" p="md" radius="md" withBorder>
              <Title order={3} mb="md">Analysis Results</Title>
              <Text>Document Type: {result.documentType}</Text>
              <Text>Extracted Information:</Text>
              <pre>{JSON.stringify(result.extractedInfo, null, 2)}</pre>
            </Paper>
          )}
        </Paper>
      </Container>
    </MantineProvider>
  )
}

export default App
