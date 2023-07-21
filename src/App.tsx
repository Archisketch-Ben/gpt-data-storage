import React, { ReactElement } from 'react'

import PromptGatheringTable from './components/PromptGatheringTable'
import { Box } from '@mui/material'

function App(): ReactElement {
  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <PromptGatheringTable />
    </Box>
  )
}

export default App
