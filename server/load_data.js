const fs = require('fs')
const path = require('path')
const esConnection = require('./connection')

/** Read an individual book txt file, and extract the title and paragraphs */
function parseBookFile (filePath) {
  // Read text file
  const book = fs.readFileSync(filePath, 'utf8')

  // Find book title 
  const title = book.match(/^Title:\s(.+)$/m)[1]
  // const dateMatch = book.match(/^Date:\s(.+)$/m)
  // const date = (!dateMatch || dateMatch[1].trim() === '') ? 'Bilinmeyen Tarih' : dateMatch[1]

  console.log(`Reading Book - ${title}`)

  // Find metadata header and footer
  const startBookMatch = book.match(/^\*{3}\s*ICERIK BASLANGIC.+\*{3}$/m)
  const startBookIndex = startBookMatch.index + startBookMatch[0].length
  const endBookIndex = book.match(/^\*{3}\s*ICERIK BITIS.+\*{3}$/m).index

  // Clean book text and split into array of paragraphs
  const paragraphs = book
    .slice(startBookIndex, endBookIndex) // Remove  header and footer
    .split(/\n\s+\n/g) // Split each paragraph into it's own array entry
    .map(line => line.replace(/\r\n/g, ' ').trim()) // Remove paragraph line breaks and whitespace
    .map(line => line.replace(/_/g, ''))  //In order to avoid from italic font remove _
    .filter((line) => (line && line !== '')) // Remove empty lines

  console.log(`Parsed ${paragraphs.length} Paragraphs\n`)
  return { title, paragraphs }
}

/** Bulk index the book data in ElasticSearch */
async function insertBookData (title, paragraphs) {
  let bulkOps = [] // Array to store bulk operations

  // Add an index operation for each section in the book
  console.log(`Parsed ${paragraphs.length} Paragraphs\n`)
  for (let i = 0; i < paragraphs.length; i++) {
    // Describe action
    bulkOps.push({ index: { _index: esConnection.index, _type: esConnection.type } })

    // Add document
    bulkOps.push({
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
    let bookFiles = fs.readdirSync('./books').filter(file => file.slice(-4) === '.txt')
    console.log(`Found ${bookFiles.length} Book Files`)

    // Read actions and orations directory
    let actionOrationFiles = fs.readdirSync('./actions_orations').filter(file => file.slice(-4) === '.txt')
    console.log(`Found ${actionOrationFiles.length} Book Files`)

    // Read comments directory
    let commentFiles = fs.readdirSync('./comments').filter(file => file.slice(-4) === '.txt')
    console.log(`Found ${commentFiles.length} Book Files`)


    // Read each book file, and index each paragraph in elasticsearch
    for (let book of bookFiles) {
      console.log(`Reading File - ${book}`)
      const bookFilePath = path.join('./books', book)

      const { title, paragraphs } = parseBookFile(bookFilePath)
      await insertBookData(title, paragraphs)
    }

    // Read each actions and orations file, and index each paragraph in elasticsearch
    for (let actOration of actionOrationFiles) {
      console.log(`Reading File - ${actOration}`)
      const actOrationFilePath = path.join('./actions_orations', actOration)
  
      const { title, paragraphs } = parseBookFile(actOrationFilePath)
      await insertBookData(title, paragraphs)
    }

    // Read each comment file, and index each paragraph in elasticsearch
    for (let comment of commentFiles) {
      console.log(`Reading File - ${comment}`)
      const commentFilePath = path.join('./comments', comment)
  
      const { title, paragraphs } = parseBookFile(commentFilePath)
      await insertBookData(title, paragraphs)
    }
  } catch (err) {
    console.error(err)
  }
}

readAndInsertBooks()
