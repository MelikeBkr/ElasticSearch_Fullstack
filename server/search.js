const { client, index, type } = require('./connection')

module.exports = {
 
  /** Query ES index for the provided term */
 /* queryTerm (term, offset = 0) {
    const body = {
      from: offset,
      query: { match: {
        text: {
          query: term,
          operator: 'and',
          fuzziness: 'auto'
        }
      
      } },
      highlight: { fields: { text: {} } }
    }

    return client.search({ index, type, body })
  },
*/
    /** Query ES index for the provided term */
    queryTerm (bookParam, term, offset = 0) {
      const body = {
        from: offset,
        query: { 
         
     /*     "multi_match" : {
            "query":     [ bookParam, term ],
            "type":       "cross_fields",
            "fields":     [ "bookType", "text" ],
            "operator":   "and"
            */
           "bool": {
            "must": [
              { "match": { "bookType":  bookParam }},
              { "match": {
                 "text" : {
                          "query" :  term,
                           operator: 'and',
                           fuzziness: 'auto'
                          }
                         } 

              }
            ]

          }	
           


/*	  "bool": {
      "must": [
        {
          "match": {
            "bookType": bookParam
          }
        },
        {
          "match": {
            "text": term
          }
        }
      ]
    }

        
         }*/
        },
        highlight: { fields: { text: {} } }
      }
    
      return client.search({ index, type, body })
    },

  /** Get the specified range of paragraphs from a book */
  getParagraphs (bookTitle, startLocation, endLocation) {
    const filter = [
      { term: { title: bookTitle, bookType:"Book" } },
      { range: { location: { gte: startLocation, lte: endLocation } } }
    ]

    const body = {
      size: endLocation - startLocation,
      sort: { location: 'asc' },
      query: { bool: { filter } }
    }

    return client.search({ index, type, body })
  },

    /** Get the specified range of paragraphs from a comment document */
    getCommentParagraphs (bookTitle, startLocation, endLocation) {
      const filter = [
        { term: { title: bookTitle, bookType: "comments" } },
        { range: { location: { gte: startLocation, lte: endLocation } } }
      ]
  
      const body = {
        size: endLocation - startLocation,
        sort: { location: 'asc' },
        query: { bool: { filter } }
      }
  
      return client.search({ index, type, body })
    }

  
}
