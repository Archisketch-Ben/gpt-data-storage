import React, { ReactElement } from 'react'

import BasicTable from './components/Table'

function App(): ReactElement {
  return (
    <div className="p-20 border shadow-xl border-gray-50 rounded-xl">
      <BasicTable />
    </div>
  )
}

export default App
