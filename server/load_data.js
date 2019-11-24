const fs = require('fs')
const path = require('path')
const esConnection = require('./connection')

/** Read an individual book txt file, and extract the title, date, and paragraphs */
function parseBookFile (filePath) {
  // Read text file
  const book = fs.readFileSync(filePath, 'utf8')

  // Find book title and date
  const title = book.match(/^Title:\s(.+)$/m)[1]
  const dateMatch = book.match(/^Date:\s(.+)$/m)
  const date = (!dateMatch || dateMatch[1].trim() === '') ? 'Bilinmeyen Tarih' : dateMatch[1]

  console.log(`Reading Book - ${title} wih date ${date}`)

  // Find metadata header and footer
  const startOfActionsBookMatch = book.match(/^\*{3}\s*ICERIK BASLANGIC.+\*{3}$/m)
  const startOfActionsBookIndex = startOfActionsBookMatch.index + startOfActionsBookMatch[0].length
  const endOfActionsBookIndex = book.match(/^\*{3}\s*ICERIK BITIS.+\*{3}$/m).index

  // Clean book text and split into array of paragraphs
  const paragraphs = book
    .slice(startOfActionsBookIndex, endOfActionsBookIndex) // Remove  header and footer
    .split(/\n\s+\n/g) // Split each paragraph into it's own array entry
    .map(line => line.replace(/\r\n/g, ' ').trim()) // Remove paragraph line breaks and whitespace
    .map(line => line.replace(/_/g, ''))  //In order to avoid from italic font remove _
    .filter((line) => (line && line !== '')) // Remove empty lines

  console.log(`Parsed ${paragraphs.length} Paragraphs\n`)
  return { title, date, paragraphs }
}

/** Bulk index the book data in ElasticSearch */
async function insertBookData (title, date, paragraphs) {
  let bulkOps = [] // Array to store bulk operations

  // Add an index operation for each section in the book
  console.log(`Parsed ${paragraphs.length} Paragraphs\n`)
  for (let i = 0; i < paragraphs.length; i++) {
    // Describe action
    bulkOps.push({ index: { _index: esConnection.index, _type: esConnection.type } })

    // Add document
    bulkOps.push({
      date,
      title,
      location: i,
      text: paragraphs[i]
    })

    if (i > 0 && i % 500 === 0) { // Do bulk insert after every 500 paragraphs
      await esConnection.client.bulk({ body: bulkOps })
      bulkOps = []
      console.log(`Indexed Paragraphs ${i - 499} - ${i}`)
    }
  }

  // Insert remainder of bulk ops array
  await esConnection.client.bulk({ body: bulkOps })
  console.log(`Indexed Paragraphs ${paragraphs.length - (bulkOps.length / 2)} - ${paragraphs.length}\n\n\n`)
}

/** Clear ES index, parse and index all files from the books directory */
async function readAndInsertBooks () {
  await esConnection.checkConnection()

  try {
    // Clear previous ES index
    await esConnection.resetIndex()

    // Read books directory
    let files = fs.readdirSync('./books').filter(file => file.slice(-4) === '.txt')
    console.log(`Found ${files.length} Files`)

    // Read each book file, and index each paragraph in elasticsearch
    for (let file of files) {
      console.log(`Reading File - ${file}`)
      const filePath = path.join('./books', file)

      const { title, date, paragraphs } = parseBookFile(filePath)
      await insertBookData(title, date, paragraphs)
    }
  } catch (err) {
    console.error(err)
  }
}

readAndInsertBooks()
