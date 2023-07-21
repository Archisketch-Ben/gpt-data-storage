import * as React from 'react'
import { DataGrid, GridColDef, GridToolbar, koKR } from '@mui/x-data-grid'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/ko'
import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'

dayjs.extend(relativeTime)

type PromptGathering = {
  transform_url: string
  room_type: string
  createdAt: string
  uuid: string
  user: string
  gpt_prompt: string
  prompt: string
  origin_url: string
  feedback: string
  style: string
}

type PromptGatheringWithIndex = PromptGathering & {
  id: number
}

export default function PromptGatheringTable() {
  const [isLoading, setIsLoading] = React.useState<boolean>(true)
  const [promptGatherings, setPromptGatherings] = React.useState<
    PromptGathering[]
  >([])

  const promptGatheringsWithIndex: PromptGatheringWithIndex[] = React.useMemo(
    () =>
      promptGatherings.map((item, index) => ({
        ...item,
        id: index + 1
      })),
    [promptGatherings]
  )

  const isProd = process.env.NODE_ENV === 'production'
  const FETCH_URL = isProd
    ? 'https://gpt-data-storage-df16986978f9.herokuapp.com/'
    : 'http://localhost:3000/'

  React.useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(
        // 'http://localhost:3000/api/diffusion-prompt-gathering'
        `${FETCH_URL}api/diffusion-prompt-gathering`
      )
      const data = await response.json()
      setPromptGatherings(data)
      setIsLoading(false)
    }

    fetchData()
  }, [])

  const baseColumns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'uuid', headerName: 'uuid', width: 60 },
    { field: 'user', headerName: 'user', width: 100 },
    {
      field: 'room_type',
      headerName: 'room_type',
      width: 100
    },
    { field: 'style', headerName: 'style' },
    {
      field: 'createdAt',
      headerName: 'createdAt',
      width: 130,
      renderCell: (params) => (
        <div className="flex flex-col items-center justify-center">
          <time>{dayjs(params.value as string).format('MM/DD HH:mm:ss')}</time>
          <div>
            (
            {dayjs(params.value as string)
              .locale('ko')
              .fromNow()}
            )
          </div>
        </div>
      )
    },
    { field: 'prompt', headerName: 'prompt', width: 320 },
    {
      field: 'gpt_prompt',
      headerName: 'gpt_prompt',
      width: 320
    },
    {
      field: 'origin_url',
      headerName: 'origin_url',
      width: 130,
      renderCell: (params) => (
        <Zoom zoomMargin={40}>
          <img
            width={120}
            height={120}
            src={params.value as string}
            alt="origin"
          />
        </Zoom>
      )
    },
    {
      field: 'transform_url',
      headerName: 'transform_url',
      width: 130,
      renderCell: (params) => (
        <Zoom zoomMargin={40}>
          <img
            width={120}
            height={120}
            src={params.value as string}
            alt="transform"
          />
        </Zoom>
      )
    },
    {
      field: 'feedback',
      headerName: 'feedback',
      width: 90,
      renderCell: (params) => (
        <div
          className={
            params.value === 'Good' ? 'text-green-500' : 'text-red-500'
          }
        >
          {params.value}
        </div>
      )
    }
  ]

  const disableSortColumns = [
    'uuid',
    'prompt',
    'gpt_prompt',
    'origin_url',
    'transform_url',
    'feedback',
    'style'
  ]
  const columns = React.useMemo(() => {
    return baseColumns.map((column) => {
      if (disableSortColumns.includes(column.field)) {
        return {
          ...column,
          sortable: false
        }
      }
      return column
    })
  }, [baseColumns])

  return (
    <DataGrid
      loading={isLoading}
      rows={promptGatheringsWithIndex}
      columns={columns}
      checkboxSelection
      disableRowSelectionOnClick
      getEstimatedRowHeight={() => 100}
      getRowHeight={() => 'auto'}
      slots={{ toolbar: GridToolbar }}
      sx={{
        '&.MuiDataGrid-root--densityCompact .MuiDataGrid-cell': {
          py: 1
        },
        '&.MuiDataGrid-root--densityStandard .MuiDataGrid-cell': {
          py: '15px'
        },
        '&.MuiDataGrid-root--densityComfortable .MuiDataGrid-cell': {
          py: '22px'
        }
      }}
      localeText={koKR.components.MuiDataGrid.defaultProps.localeText}
    />
  )
}
