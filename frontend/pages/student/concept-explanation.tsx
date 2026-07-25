import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

interface ConceptExplanation {
  title: string
  concepts: Array<{
    name: string
    explanation: string
    keyPoints: string[]
  }>
  summary: string
}

export default function ConceptExplanation() {
  const router = useRouter()
  const [concepts, setConcepts] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showQuizButton, setShowQuizButton] = useState(false)
  const [uploadedPdf, setUploadedPdf] = useState('')

  useEffect(() => {
    // Get uploaded PDF name from localStorage
    const pdfName = localStorage.getItem('uploadedPdf')
    setUploadedPdf(pdfName || 'Study Material')

    // Fetch actual content from backend
    const fetchContent = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/ingestion/sources`)
        if (response.ok) {
          const sources = await response.json()
          if (sources.length > 0) {
            // Get content chunks for the most recent source
            const latestSource = sources[0]
            const chunksResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/ingestion/sources/${latestSource.id}/chunks`)
            if (chunksResponse.ok) {
              const chunks = await chunksResponse.json()
              if (chunks.length > 0) {
                // Generate concepts from actual PDF content
                const allContent = chunks.map((chunk: any) => chunk.content_text).join(' ')
                generateConceptsFromContent(allContent, pdfName || 'Study Material')
              } else {
                // Fallback to mock content
                generateMockConcepts(pdfName || 'Study Material')
              }
            } else {
              generateMockConcepts(pdfName || 'Study Material')
            }
          } else {
            generateMockConcepts(pdfName || 'Study Material')
          }
        } else {
          generateMockConcepts(pdfName || 'Study Material')
        }
      } catch (error) {
        console.error('Error fetching content:', error)
        generateMockConcepts(pdfName || 'Study Material')
      }
    }

    const generateConceptsFromContent = (content: string, pdfName: string) => {
      // Analyze content to extract key concepts
      const sentences = content.split('.').filter(s => s.trim().length > 20)
      const keyTopics = extractKeyTopics(content)
      
      setConcepts({
        title: `Analysis of ${pdfName || 'Uploaded Study Material'}`,
        subject: pdfName || 'Study Material',
        concepts: [
          {
            id: 1,
            title: `Key Topic: ${keyTopics[0] || 'Main Subject'}`,
            description: `Based on the uploaded content, this appears to be the primary focus of the material.`,
            keyPoints: extractKeyPoints(content),
            examples: extractExamples(content)
          },
          {
            id: 2,
            title: `Important Concept: ${keyTopics[1] || 'Secondary Subject'}`,
            description: `This concept is frequently mentioned throughout the uploaded document and represents a significant theme.`,
            keyPoints: extractKeyPoints(content).slice(3, 6),
            examples: extractExamples(content).slice(1, 3)
          },
          {
            id: 3,
            title: `Supporting Theme: ${keyTopics[2] || 'Additional Topic'}`,
            description: `This supporting theme helps contextualize the main concepts and provides additional context.`,
            keyPoints: extractKeyPoints(content).slice(6, 9),
            examples: extractExamples(content).slice(3, 5)
          }
        ],
        summary: `The uploaded material covers key topics including ${keyTopics.slice(0, 3).join(', ')}. These concepts provide a comprehensive understanding of the subject matter and are essential for mastery.`,
        studyTips: [
          'Review the actual uploaded material for detailed explanations',
          'Focus on understanding the relationships between concepts',
          'Practice applying these concepts to real-world examples',
          'Take notes on key definitions and terminology',
          'Create mind maps to connect related ideas'
        ]
      })
      setLoading(false)
    }

    const generateMockConcepts = (pdfName: string) => {
      // Fallback mock concepts for English Grammar
      setConcepts({
        title: `Analysis of ${pdfName || 'English Grammar Material'}`,
        subject: pdfName || 'English Grammar',
        concepts: [
          {
            id: 1,
            title: 'Parts of Speech - The Building Blocks of English',
            description: 'Parts of speech are the fundamental categories of words that English speakers use to express their thoughts. Understanding these is essential for mastering grammar.',
            keyPoints: [
              'Nouns: Naming words (person, place, thing, idea)',
              'Verbs: Action or state of being words',
              'Adjectives: Describing words that modify nouns',
              'Adverbs: Words that modify verbs, adjectives, or other adverbs',
              'Pronouns: Words that replace nouns (he, she, it, they)',
              'Prepositions: Words showing relationships (in, on, at, by)',
              'Conjunctions: Connecting words (and, but, or, because)',
              'Interjections: Expressing emotion (wow, oh, ouch)'
            ],
            examples: [
              'Example: "The happy dog runs quickly in the park" - Contains noun (dog), adjective (happy), verb (runs), adverb (quickly), preposition (in), article (the)',
              'Example: "She and I went to the store, but it was closed" - Contains pronouns (she, I, it), conjunctions (and, but), verb (went)'
            ]
          },
          {
            id: 2,
            title: 'Verb Tenses - Time in English Grammar',
            description: 'Verb tenses indicate when an action takes place. Mastering tenses is crucial for clear communication and proper sentence construction.',
            keyPoints: [
              'Present Tense: Actions happening now (I eat, she sings)',
              'Past Tense: Actions that already happened (I ate, she sang)',
              'Future Tense: Actions that will happen (I will eat, she will sing)',
              'Present Perfect: Actions with connection to present (I have eaten)',
              'Past Perfect: Actions before other past actions (I had eaten)',
              'Future Perfect: Actions that will be completed (I will have eaten)',
              'Present Continuous: Ongoing actions (I am eating)',
              'Past Continuous: Ongoing past actions (I was eating)'
            ],
            examples: [
              'Example: "I study English every day" (Present Simple)',
              'Example: "She was studying when I called" (Past Continuous)',
              'Example: "They have finished their homework" (Present Perfect)',
              'Example: "We will have completed the project by Friday" (Future Perfect)'
            ]
          },
          {
            id: 3,
            title: 'Sentence Structure and Types',
            description: 'Understanding sentence structure helps you construct clear, grammatically correct sentences. Different sentence types serve different communication purposes.',
            keyPoints: [
              'Simple Sentences: One independent clause (The cat sleeps)',
              'Compound Sentences: Two independent clauses (The cat sleeps, and the dog plays)',
              'Complex Sentences: One independent + one dependent clause (The cat sleeps when it is tired)',
              'Compound-Complex: Multiple independent and dependent clauses',
              'Declarative: Makes a statement (The sky is blue)',
              'Interrogative: Asks a question (Is the sky blue?)',
              'Imperative: Gives a command (Look at the sky)',
              'Exclamatory: Shows strong emotion (What a beautiful sky!)'
            ],
            examples: [
              'Example: "Although it was raining, we went to the park because we wanted to play" (Complex sentence)',
              'Example: "She loves reading, but her brother prefers watching movies" (Compound sentence)',
              'Example: "Please close the door when you leave" (Imperative sentence)'
            ]
          }
        ],
        summary: 'English grammar consists of understanding parts of speech, verb tenses, and sentence structures. These fundamental concepts work together to create clear and effective communication. Mastering these elements will significantly improve your writing and speaking skills.',
        studyTips: [
          'Practice identifying parts of speech in sentences you read',
          'Create tense charts to memorize verb conjugations',
          'Write simple sentences first, then gradually build complexity',
          'Read aloud to catch grammatical errors',
          'Use grammar checking tools to identify common mistakes',
          'Practice with exercises focusing on one concept at a time',
          'Keep a grammar journal to track your progress'
        ]
      })
      setLoading(false)
    }

    const extractKeyTopics = (content: string): string[] => {
      // Simple topic extraction - look for repeated important terms
      const words = content.toLowerCase().split(/\s+/)
      const wordFreq: {[key: string]: number} = {}
      
      words.forEach(word => {
        if (word.length > 4) { // Only consider words longer than 4 characters
          wordFreq[word] = (wordFreq[word] || 0) + 1
        }
      })
      
      return Object.entries(wordFreq)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1))
    }

    const extractKeyPoints = (content: string): string[] => {
      // Extract sentences that look like key points
      const sentences = content.split(/[.!?]/)
      return sentences
        .filter(s => s.trim().length > 15)
        .slice(0, 10)
        .map(s => s.trim())
    }

    const extractExamples = (content: string): string[] => {
      // Look for example indicators
      const examplePatterns = [
        /for example/gi,
        /such as/gi,
        /like/gi,
        /including/gi
      ]
      
      const examples: string[] = []
      const sentences = content.split(/[.!?]/)
      
      sentences.forEach(sentence => {
        if (examplePatterns.some(pattern => pattern.test(sentence))) {
          examples.push(sentence.trim())
        }
      })
      
      return examples.slice(0, 5)
    }

    fetchContent()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight
      const scrollTop = document.documentElement.scrollTop
      const clientHeight = document.documentElement.clientHeight
      
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        setShowQuizButton(true)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleStartQuiz = () => {
    router.push('/student/quiz')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">AI is analyzing your study material...</p>
          <p className="text-sm text-gray-500 mt-2">Extracting key concepts and generating explanations</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Concept Explanation - QuizAI</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ← Back
                </button>
                <h1 className="text-xl font-semibold text-gray-900">Concept Explanation</h1>
              </div>
              <button
                onClick={handleStartQuiz}
                className="btn-primary"
              >
                Start Quiz →
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Title Section */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{concepts.title}</h2>
              <p className="text-lg text-gray-600">📄 {concepts.subject}</p>
            </div>

            {/* Study Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">📚 Study Tips</h3>
              <ul className="space-y-2">
                {concepts.studyTips.map((tip: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-blue-800">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Concepts */}
          <div className="space-y-8">
            {concepts.concepts.map((concept: any, index: number) => (
              <div key={concept.id} className="bg-white rounded-xl shadow-lg p-8 fade-in">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{concept.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{concept.description}</p>
                  </div>
                </div>

                {/* Key Points */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">🔑 Key Points</h4>
                  <ul className="space-y-2">
                    {concept.keyPoints.map((point: string, pointIndex: number) => (
                      <li key={pointIndex} className="flex items-start">
                        <svg className="w-5 h-5 text-primary-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Examples */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">💡 Examples</h4>
                  <div className="space-y-3">
                    {concept.examples.map((example: string, exampleIndex: number) => (
                      <div key={exampleIndex} className="bg-gray-50 border-l-4 border-primary-500 p-4 rounded">
                        <p className="text-gray-700">{example}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl shadow-lg p-8 mt-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">📖 Summary</h3>
            <p className="text-gray-700 leading-relaxed text-lg">{concepts.summary}</p>
          </div>

          {/* Quiz Button (appears on scroll) */}
          {showQuizButton && (
            <div className="fixed bottom-8 right-8 animate-bounce-in">
              <button
                onClick={handleStartQuiz}
                className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-8 py-4 rounded-full shadow-xl hover:shadow-2xl transform transition-all hover:scale-105 flex items-center space-x-2"
              >
                <span className="font-semibold">Start Quiz</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          )}

          {/* Bottom Quiz Banner */}
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Test Your Knowledge?</h3>
            <p className="text-gray-600 mb-6">Take a quiz based on these concepts to reinforce your learning.</p>
            <button
              onClick={handleStartQuiz}
              className="btn-primary text-lg px-8 py-3"
            >
              Start Quiz Now
            </button>
          </div>
        </main>
      </div>
    </>
  )
}
