import { useState } from 'react'
import { MantineProvider, Container, Title, Paper, Text, LoadingOverlay, Grid, Badge, Divider, Stack } from '@mantine/core'
import { Dropzone } from '@mantine/dropzone'
import axios from 'axios'
import './App.css'

interface DocumentResult {
  message?: string;
  success?: boolean;
  fileName?: string;
  fileType?: string;
  processedAt?: string;
  extractedData?: {
    documentType?: string;
    personalInfo?: {
      name?: string;
      dateOfBirth?: string;
      address?: string | null;
      nationality?: string;
      gender?: string;
    };
    documentNumber?: string;
    issueDate?: string;
    expiryDate?: string;
    issuingAuthority?: string;
    country?: string;
    additionalInfo?: {
      placeOfBirth?: string;
      place_of_birth?: string;
      type?: string;
      countryCode?: string;
      country_code?: string;
      machineReadableZone?: string;
      placeOfIssue?: string;
      holder_signature?: string;
      [key: string]: any;
    };
  };
}

function App() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DocumentResult | null>(null)
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    // Handle different date formats
    if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/');
      return `${day}/${month}/${year}`;
    }
    return dateString;
  }

  const renderDocumentInfo = () => {
    if (!result || !result.extractedData) return null;

    const data = result.extractedData;
    console.log('Extracted data:', data); // Debug log

    return (
      <Paper mt="md" p="lg" radius="md" withBorder>
        <Stack spacing="md">
          <div>
            <Title order={3} mb="md">Document Analysis Results</Title>
            <Badge size="lg" color="blue" variant="filled">
              {data.documentType?.toUpperCase() || 'UNKNOWN'}
            </Badge>
            {result.fileName && (
              <Text size="sm" color="dimmed" mt="xs">
                File: {result.fileName}
              </Text>
            )}
          </div>

          <Divider />

          {/* Personal Information */}
          <div>
            <Title order={4} mb="sm" color="dark">Personal Information</Title>
            <Grid>
              <Grid.Col span={6}>
                <Text size="sm" color="dimmed">Full Name</Text>
                <Text weight={500}>{data.personalInfo?.name || 'N/A'}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" color="dimmed">Date of Birth</Text>
                <Text weight={500}>{formatDate(data.personalInfo?.dateOfBirth || '') || 'N/A'}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" color="dimmed">Nationality</Text>
                <Text weight={500}>{data.personalInfo?.nationality || 'N/A'}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" color="dimmed">Gender</Text>
                <Text weight={500}>{data.personalInfo?.gender || 'N/A'}</Text>
              </Grid.Col>
              {data.personalInfo?.address && (
                <Grid.Col span={12}>
                  <Text size="sm" color="dimmed">Address</Text>
                  <Text weight={500}>{data.personalInfo.address}</Text>
                </Grid.Col>
              )}
            </Grid>
          </div>

          <Divider />

          {/* Document Details */}
          <div>
            <Title order={4} mb="sm" color="dark">Document Details</Title>
            <Grid>
              <Grid.Col span={6}>
                <Text size="sm" color="dimmed">Document Number</Text>
                <Text weight={500} family="monospace">{data.documentNumber || 'N/A'}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" color="dimmed">Country</Text>
                <Text weight={500}>{data.country || 'N/A'}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" color="dimmed">Issue Date</Text>
                <Text weight={500}>{formatDate(data.issueDate || '') || 'N/A'}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" color="dimmed">Expiry Date</Text>
                <Text weight={500}>{formatDate(data.expiryDate || '') || 'N/A'}</Text>
              </Grid.Col>
              <Grid.Col span={12}>
                <Text size="sm" color="dimmed">Issuing Authority</Text>
                <Text weight={500}>{data.issuingAuthority || 'N/A'}</Text>
              </Grid.Col>
            </Grid>
          </div>

          {/* Additional Information */}
          {data.additionalInfo && Object.keys(data.additionalInfo).length > 0 && (
            <>
              <Divider />
              <div>
                <Title order={4} mb="sm" color="dark">Additional Information</Title>
                <Grid>
                  {(data.additionalInfo.placeOfBirth || data.additionalInfo.place_of_birth) && (
                    <Grid.Col span={6}>
                      <Text size="sm" color="dimmed">Place of Birth</Text>
                      <Text weight={500}>{data.additionalInfo.placeOfBirth || data.additionalInfo.place_of_birth}</Text>
                    </Grid.Col>
                  )}
                  {data.additionalInfo.placeOfIssue && (
                    <Grid.Col span={6}>
                      <Text size="sm" color="dimmed">Place of Issue</Text>
                      <Text weight={500}>{data.additionalInfo.placeOfIssue}</Text>
                    </Grid.Col>
                  )}
                  {data.additionalInfo.type && (
                    <Grid.Col span={6}>
                      <Text size="sm" color="dimmed">Document Type</Text>
                      <Text weight={500}>{data.additionalInfo.type}</Text>
                    </Grid.Col>
                  )}
                  {(data.additionalInfo.countryCode || data.additionalInfo.country_code) && (
                    <Grid.Col span={6}>
                      <Text size="sm" color="dimmed">Country Code</Text>
                      <Text weight={500} family="monospace">{data.additionalInfo.countryCode || data.additionalInfo.country_code}</Text>
                    </Grid.Col>
                  )}
                  {data.additionalInfo.holder_signature && (
                    <Grid.Col span={6}>
                      <Text size="sm" color="dimmed">Holder Signature</Text>
                      <Text weight={500}>{data.additionalInfo.holder_signature}</Text>
                    </Grid.Col>
                  )}
                  {data.additionalInfo.machineReadableZone && (
                    <Grid.Col span={12}>
                      <Text size="sm" color="dimmed">Machine Readable Zone</Text>
                      <Text weight={500} family="monospace" size="xs">
                        {data.additionalInfo.machineReadableZone}
                      </Text>
                    </Grid.Col>
                  )}
                </Grid>
              </div>
            </>
          )}
        </Stack>
      </Paper>
    )
  }

  return (
    <MantineProvider>
      <Container size="md" py="xl">
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

          {renderDocumentInfo()}
        </Paper>
      </Container>
    </MantineProvider>
  )
}

export default App;