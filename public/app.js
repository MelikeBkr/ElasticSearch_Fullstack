const vm = new Vue ({
  el: '#vue-instance',
  data () {
    return {
      baseUrl: 'http://localhost:3000', // API url
      searchTerm: 'Ara', // Default search term
      searchDebounce: null, // Timeout for search bar debounce
      searchResults: [], // Displayed book search results
      numHits: null, // Total search results found
      searchOffset: 0, // Search result pagination offset
      searchCommentsOffset: 0,
      searchActionAndOrationOffset: 0,

      selectedParagraph: null, // Selected paragraph object
      bookOffset: 0, // Offset for book paragraphs being displayed
      commentsOffset: 0,
      actionAndOrationOffset: 0,

      actionsOrationsOffset: 0, // Offset for actions orations paragraphs being displayed
      commentOffset:0, // Offset for comment paragraphs being displayed
      paragraphs: [], // Paragraphs being displayed in book preview window
      bookTypeAtt: "comments",
      searchCommentResults: [], // Displayed comment search results
      selectedCommentParagraph: null, // Selected comment paragraph object
      searchActionsOrationsResults: [], // Displayed actions and orations search results
      selectedActionsOrationsParagraph: null, // Selected actions and orations paragraph object

      commentParagraphs: [], // Paragraphs being displayed in comments preview window
      actionsOrationsParagraphs: [] // Paragraphs being displayed in comments preview window
    }
  },
  async created () {
    this.bookTypeAtt  = "Book"
    this.searchResults = await this.search() // Search for default term
    this.bookTypeAtt  = "comments"
    this.searchCommentResults = await this.search() // Search for default term
    this.bookTypeAtt  = "actions_orations"
    this.searchActionsOrationsResults = await this.search() // Search for default term
  },
  methods: {
    /** Debounce search input by 100 ms */
    onSearchInput () {
      clearTimeout(this.searchDebounce)
      this.searchDebounce = setTimeout(async () => {
        this.searchOffset = 0
        this.bookTypeAtt  = "Book"
        this.searchResults = await this.search()

        this.searchCommentsOffset = 0;
        this.bookTypeAtt  = "comments"
        this.searchCommentResults = await this.search()

        this.searchActionAndOrationOffset = 0;
        this.bookTypeAtt  = "actions_orations"
        this.searchActionsOrationsResults = await this.search()
      }, 100)
    },
    /** Call API to search for inputted term */
    async search () {

      if(this.bookTypeAtt  == "Book")
      {
        var responseBook = await axios.get(`${this.baseUrl}/search`, { params: {bookParam: this.bookTypeAtt,  term: this.searchTerm,  offset: this.searchOffset } })
      
         return responseBook.data.hits.hits
        }
      else if (this.bookTypeAtt  == "comments")
      {
        var responseComments = await axios.get(`${this.baseUrl}/search`, { params: {bookParam: this.bookTypeAtt,  term: this.searchTerm,  offset: this.searchCommentsOffset } })
        return responseComments.data.hits.hits
      }
      else if ( this.bookTypeAtt  == "actions_orations")
      {
        var responseActionOrations = await axios.get(`${this.baseUrl}/search`, { params: {bookParam: this.bookTypeAtt,  term: this.searchTerm,  offset: this.searchActionAndOrationOffset } })
        return responseActionOrations.data.hits.hits
      }

      this.numHits = 0//response.data.hits.total
      
    },
    
    /** Get next page of search results */
    async nextResultsPage () {
      if (this.numHits > 10) {
        this.searchOffset += 10
        if (this.searchOffset + 5 > this.numHits) { this.searchOffset = this.numHits - 5}
        this.bookTypeAtt  = "Book"
        this.searchResults = await this.search()
        this.bookTypeAtt  = "comments"
        this.searchCommentResults = await this.search()
        this.bookTypeAtt  = "actions_orations"
        this.searchActionsOrationsResults = await this.search()
        document.documentElement.scrollTop = 0
      }
    },
    /** Get previous page of search results */
    async prevResultsPage () {
      this.searchOffset -= 10
      if (this.searchOffset < 0) { this.searchOffset = 0 }
      this.bookTypeAtt  = "Book"
      this.searchResults = await this.search()
      this.bookTypeAtt  = "comments"
      this.searchCommentResults = await this.search()
      this.bookTypeAtt  = "actions_orations"
      this.searchActionsOrationsResults = await this.search()
      document.documentElement.scrollTop = 0
    },
    /** Call the API to get current page of paragraphs */
    async getParagraphs (bookTitle, offset) {
      try {
        this.bookTypeAtt  = "Book"
        this.bookOffset = offset
        const start = this.bookOffset
        const end = this.bookOffset + 10
        const response = await axios.get(`${this.baseUrl}/paragraphs`, { params: { bookTitle, start, end } })
        return response.data.hits.hits
      } catch (err) {
        console.error(err)
      }
    },
    /** Call the API to get current page of comment paragraphs */
    async getCommentParagraphs (bookTitle, offset) {
      try {
        this.bookTypeAtt  = "comments"
        this.commentsOffset = offset
        const start = this.commentsOffset
        const end = this.commentsOffset + 10
        const response = await axios.get(`${this.baseUrl}/commentParagraphs`, { params: { bookTitle, start, end } })
        return response.data.hits.hits
      } catch (err) {
        console.error(err)
      }
    },
    /** Call the API to get current page of comment paragraphs */
    async getActionsOrationsParagraphs (bookTitle, offset) {
      try {
        this.bookTypeAtt  = "actions_orations"
        this.actionAndOrationOffset = offset
        const start = this.actionAndOrationOffset
        const end = this.actionAndOrationOffset + 10
        const response = await axios.get(`${this.baseUrl}/actionsOrationsParagraphs`, { params: { bookTitle, start, end } })
        return response.data.hits.hits
      } catch (err) {
        console.error(err)
      }
    },
    /** Get next page (next 10 paragraphs) of selected book */
    async nextBookPage () {
      this.$refs.bookModal.scrollTop = 0
      this.paragraphs = await this.getParagraphs(this.selectedParagraph._source.title, this.bookOffset + 5)
    },
    /** Get previous page (previous 10 paragraphs) of selected book */
    async prevBookPage () {
      this.$refs.bookModal.scrollTop = 0
      this.paragraphs = await this.getParagraphs(this.selectedParagraph._source.title, this.bookOffset - 5)
    },

    /** Get next page (next 10 paragraphs) of selected comment */
    async nextCommentPage () {
      this.$refs.commentModal.scrollTop = 0
      this.commentParagraphs = await this.getCommentParagraphs(this.selectedCommentParagraph._source.title, this.commentsOffset + 5)
    },
    /** Get previous page (previous 10 paragraphs) of selected comment */
    async prevCommentPage () {
      this.$refs.commentModal.scrollTop = 0
      this.commentParagraphs = await this.getCommentParagraphs(this.selectedCommentParagraph._source.title, this.commentsOffset - 5)
    },

    /** Get next page (next 10 paragraphs) of selected actions and orations */
    async nextActionsOrationsPage () {
      this.$refs.bookModal.scrollTop = 0
      this.actionsOrationsParagraphs = await this.getActionsOrationsParagraphs(this.selectedActionsOrationsParagraph._source.title, this.actionAndOrationOffset + 5)
    },
    /** Get previous page (previous 10 paragraphs) of selected actions and orations */
    async prevActionsOrationsPage () {
      this.$refs.bookModal.scrollTop = 0
      this.actionsOrationsParagraphs = await this.getActionsOrationsParagraphs(this.selectedActionsOrationsParagraph._source.title, this.actionAndOrationOffset - 5)
    },
    /** Display paragraphs from selected book in modal window */
    async showBookModal (searchHit) {
      try {
        document.body.style.overflow = 'hidden'
        this.bookTypeAtt  = "Book"
        this.selectedParagraph = searchHit
        this.paragraphs = await this.getParagraphs(searchHit._source.title, searchHit._source.location - 5)
      } catch (err) {
        console.error(err)
      }
    },
    /** Display paragraphs from selected book in modal window */
    async showCommentsBookModal (searchHitComment) {
      try {
        document.body.style.overflow = 'hidden'
        this.bookTypeAtt  = "comments"
        this.selectedCommentParagraph = searchHitComment
        this.commentParagraphs = await this.getCommentParagraphs(searchHitComment._source.title, searchHitComment._source.location - 5)
      } catch (err) {
        console.error(err)
      }
    },  
    /** Display paragraphs from selected book in modal window */
    async showActionsOrationsBookModal (searchHitComment) {
      try {
        document.body.style.overflow = 'hidden'
        this.bookTypeAtt  = "actions_orations"
        this.selectedActionsOrationsParagraph = searchHitComment
        this.actionsOrationsParagraphs = await this.getActionsOrationsParagraphs(searchHitComment._source.title, searchHitComment._source.location - 5)
      } catch (err) {
        console.error(err)
      }
    },

    /** Close the book detail modal */
    closeBookModal () {
      document.body.style.overflow = 'auto'
      this.selectedParagraph = null
    },
    /** Close the comments detail modal */
    closeCommentsModal () {
      document.body.style.overflow = 'auto'
      this.selectedCommentParagraph = null
    },
    /** Close the actions and orations detail modal */
    closeActionsOrationsModal () {
      document.body.style.overflow = 'auto'
      this.selectedActionsOrationsParagraph = null
    }      
  }
})
