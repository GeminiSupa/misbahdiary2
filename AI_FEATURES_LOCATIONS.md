# Where to Find AI Features in the Dashboard

## 🎯 AI Features Locations

### 1. **AI Assistant Page** (Main Access)
- **Location**: `/ai-assistant`
- **Access**: Click "AI Assistant" in the sidebar navigation
- **Features**:
  - Full-screen AI chat interface
  - Ask questions about all your cases and documents
  - Research across your entire knowledge base
  - Document analysis and insights

### 2. **Dashboard Page** (`/dashboard`)
- **Location**: Main dashboard, bottom section
- **Features**:
  - Quick access AI chat widget
  - Ask general questions
  - Link to full AI Assistant page
  - Height: 400px (mobile) / 500px (desktop)

### 3. **Case Detail Page** (`/cases/[id]`)
- **Location**: Right sidebar, below Finance and Team cards
- **Features**:
  - Context-aware AI assistant for the specific case
  - Ask questions about this case's documents
  - Get insights specific to this matter
  - Height: 400px (mobile) / 500px (desktop)

### 4. **Documents Card** (Within Case Pages)
- **Location**: In the Matter Documents card, below each document
- **Features**:
  - Document Analysis Card for each uploaded document
  - Shows processing status
  - Entity extraction results
  - AI-generated summary
  - Process/retry document analysis

## 📍 Navigation

### Sidebar Menu
The AI Assistant is now in the main navigation:
- Dashboard
- Cases
- Calendar
- Time Tracking
- Billing
- Clients
- **AI Assistant** ← New!
- Settings

## 🎨 UI Components Used

1. **`AIAssistantChat`** - Main chat interface
   - Used in: Dashboard, Case pages, AI Assistant page
   - Features: Message history, source citations, loading states

2. **`DocumentAnalysisCard`** - Document analysis widget
   - Used in: Matter Documents card
   - Features: Processing status, entity count, summary preview

## 🔍 How to Use

### From Dashboard:
1. Scroll to bottom of dashboard
2. See "AI Research Assistant" card
3. Type your question in the chat
4. Click "Open Full Assistant" for full-screen experience

### From Case Page:
1. Open any case/matter
2. Scroll to right sidebar
3. Find "AI Research Assistant" card
4. Ask questions specific to that case

### From Documents:
1. Go to any case page
2. Find "Matter Documents" section
3. Each document has an "AI Analysis" card
4. Click "Process Document" to analyze it
5. View extracted entities and summary

### From Sidebar:
1. Click "AI Assistant" in sidebar
2. Full-screen AI assistant opens
3. Ask any question about your practice

## 💡 Example Questions

- "What are the key points in case [case number]?"
- "Find similar cases to [current case]"
- "Summarize the documents for matter [matter name]"
- "What statutes are referenced in this case?"
- "Who are the parties involved in [case]?"

## 🚀 Quick Access Tips

1. **Keyboard Shortcut**: Consider adding a keyboard shortcut (future enhancement)
2. **Search Integration**: AI can be accessed from search bar (future enhancement)
3. **Context Menu**: Right-click on documents to "Analyze with AI" (future enhancement)

## 📱 Responsive Design

- **Mobile**: Compact chat interface, scrollable
- **Tablet**: Medium-sized chat widget
- **Desktop**: Full-height chat interface with better visibility

All AI features are fully responsive and work on all screen sizes!
