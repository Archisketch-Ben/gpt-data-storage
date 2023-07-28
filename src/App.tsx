import React, { ReactElement } from 'react'
import { Box } from '@mui/material'

import PromptGatheringTable from './components/PromptGatheringTable'

function App(): ReactElement {
  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <PromptGatheringTable />
    </Box>
  )
}

export default App
