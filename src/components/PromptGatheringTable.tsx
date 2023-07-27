import { Alert, Button, Checkbox, Snackbar } from '@mui/material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as React from 'react'
import ExcelJS, { Style } from 'exceljs'
import {
  DataGrid,
  GridColDef,
  koKR,
  GridToolbarContainer,
  GridToolbarContainerProps,
  GridToolbarExportProps,
  GridCsvExportOptions,
  GridToolbarExport,
  GridToolbarColumnsButton,
  GridToolbarDensitySelector,
  GridToolbarQuickFilter,
  GridToolbarFilterButton
} from '@mui/x-data-grid'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/ko'
import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'

const isProd = process.env.NODE_ENV === 'production'
const port = isProd ? 5000 : 3000
const FETCH_URL = isProd
  ? 'https://gpt-data-storage-df16986978f9.herokuapp.com/'
  : `http://localhost:${port}/`

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
  isSelected: boolean
}

type UpdatePromptGatheringParams = Pick<PromptGathering, 'uuid' | 'isSelected'>

type PromptGatheringWithIndex = PromptGathering & {
  id: number
}

async function createExcel(data: PromptGatheringWithIndex[]) {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('archi-prompt')

  sheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'uuid', key: 'uuid', width: 10 },
    { header: 'user', key: 'user', width: 10 },
    { header: 'room_type', key: 'room_type', width: 10 },
    { header: 'style', key: 'style', width: 15 },
    { header: 'createdAt', key: 'createdAt', width: 20 },
    { header: 'prompt', key: 'prompt', width: 50 },
    { header: 'gpt_prompt', key: 'gpt_prompt', width: 100 },
    { header: 'origin_url', key: 'origin_url', width: 20 },
    { header: 'transform_url', key: 'transform_url', width: 20 },
    { header: 'feedback', key: 'feedback', width: 10 }
  ]

  data.forEach(async (item) => {
    const row = {
      id: item.id,
      uuid: item.uuid,
      user: item.user,
      room_type: item.room_type,
      style: item.style,
      createdAt: item.createdAt,
      prompt: item.prompt,
      gpt_prompt: item.gpt_prompt,
      origin_url: item.origin_url,
      transform_url: item.transform_url,
      feedback: item.feedback
    }

    sheet.addRow(row)

    const rowLength = sheet.rowCount
    for (let i = 2; i < rowLength; i++) {
      const cellAlignmentStyle: Style['alignment'] = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true
      }

      const cellCount = sheet.columnCount
      const cellAlphabets = Array.from(Array(cellCount).keys()).map((index) =>
        String.fromCharCode(65 + index)
      )
      cellAlphabets.forEach((alphabet) => {
        const cell = sheet.getCell(`${alphabet}${i}`)
        cell.alignment = cellAlignmentStyle
      })

      const originUrlCell = sheet.getCell(`I${i}`)
      originUrlCell.value = {
        formula: `HYPERLINK("${row.origin_url}", "origin")`,
        date1904: false
      }

      const transformUrlCell = sheet.getCell(`J${i}`)
      transformUrlCell.value = {
        formula: `HYPERLINK("${row.transform_url}", "transform")`,
        date1904: false
      }
    }

    // FIXME: 병목 이슈로 사용하지 않음
    // const originImageResponse = await axios.get(
    //   `${FETCH_URL}api/fetch-image?url=${item.origin_url}`
    // )
    // const originImageId = workbook.addImage({
    //   buffer: originImageResponse.data,
    //   extension: 'png'
    // })

    // const transformResponse = await axios.get(
    //   `${FETCH_URL}api/fetch-image?url=${item.transform_url}`
    // )
    // const transformImageId = workbook.addImage({
    //   buffer: transformResponse.data,
    //   extension: 'png'
    // })

    // const rowNumber = sheet.rowCount
    // sheet.addImage(originImageId, {
    //   tl: { col: 8, row: rowNumber - 1 },
    //   ext: { width: 120, height: 120 }
    // })

    // sheet.addImage(transformImageId, {
    //   tl: { col: 9, row: rowNumber - 1 },
    //   ext: { width: 120, height: 120 }
    // })
  })

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
  })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'archi-prompt.xlsx'
  a.click()
}

const options: GridCsvExportOptions = {
  fileName: 'archi-prompt',
  utf8WithBom: true
}

function CustomToolbar(
  exportExcel: () => void,
  toolbarContainerProps?: GridToolbarContainerProps,
  toolbarExportContainerProps?: GridToolbarExportProps
) {
  const [isExporting, setIsExporting] = React.useState<boolean>(false)

  const handleExportExcel = () => {
    setIsExporting(true)
    exportExcel()
  }

  React.useEffect(() => {
    if (isExporting) {
      setTimeout(() => {
        setIsExporting(false)
      }, 3_000)
    }
  }, [isExporting])

  return (
    <GridToolbarContainer {...toolbarContainerProps}>
      <GridToolbarExport
        csvOptions={{ ...options }}
        {...toolbarExportContainerProps}
      />
      <GridToolbarDensitySelector />
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarQuickFilter />
      <Button
        variant="contained"
        size="small"
        onClick={handleExportExcel}
        disabled={isExporting}
      >
        Excel로 내보내기
      </Button>
    </GridToolbarContainer>
  )
}

export default function PromptGatheringTable() {
  const queryClient = useQueryClient()

  const [showLoadingSnackbar, setShowLoadingSnackbar] =
    React.useState<boolean>(false)
  const [showCompleteSnackbar, setShowCompleteSnackbar] =
    React.useState<boolean>(false)

  const getPromptGatherings = async () => {
    const response = await fetch(`${FETCH_URL}api/diffusion-prompt-gathering`)
    const data = await response.json()

    return data
  }

  const { data: promptGatherings, isLoading } = useQuery<
    PromptGatheringWithIndex[]
  >({
    queryKey: ['prompt-gatherings'],
    queryFn: getPromptGatherings
  })

  const { mutate } = useMutation({
    mutationFn: (params: UpdatePromptGatheringParams) =>
      fetch(`${FETCH_URL}api/diffusion-prompt-gathering`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      }),
    onMutate: async (updateParams) => {
      await queryClient.cancelQueries(['prompt-gatherings'])

      const previousPromptGatherings = queryClient.getQueryData<
        PromptGatheringWithIndex[]
      >(['prompt-gatherings'])

      queryClient.setQueryData<PromptGatheringWithIndex[]>(
        ['prompt-gatherings'],
        (old) => {
          const updatedPromptGatherings = old?.map((item) => {
            if (item.uuid === updateParams.uuid) {
              return {
                ...item,
                isSelected: updateParams.isSelected
              }
            }
            return item
          })
          return updatedPromptGatherings
        }
      )

      return { previousPromptGatherings }
    },
    onError: (err, updateParams, context) => {
      queryClient.setQueryData(
        ['prompt-gatherings'],
        context?.previousPromptGatherings
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries(['prompt-gatherings'])
    }
  })

  const baseColumns: GridColDef[] = [
    {
      field: 'isSelected',
      headerName: '선택',
      width: 90,
      renderCell: (params) => {
        const isSelected = (params.value as boolean) ?? false
        const uuid = params.row.uuid
        const handleSelect = () => {
          mutate({
            uuid,
            isSelected: !isSelected
          })
        }

        return (
          <Checkbox
            checked={isSelected}
            onChange={handleSelect}
            inputProps={{ 'aria-label': 'controlled' }}
          />
        )
      }
    },
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'uuid', headerName: 'uuid', width: 120, flex: 0 },
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

  const handleExportExcel = () => {
    if (isLoading) {
      setShowLoadingSnackbar(true)
      return
    }

    createExcel(promptGatherings ?? [])
      .then(() => {
        setShowCompleteSnackbar(true)
      })
      .catch((err) => {
        console.error(err)
      })
  }

  return (
    <>
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={showLoadingSnackbar}
        autoHideDuration={2000}
        onClose={() => setShowLoadingSnackbar(false)}
      >
        <Alert severity="info">데이터 로딩 중입니다.</Alert>
      </Snackbar>
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={showCompleteSnackbar}
        autoHideDuration={2000}
        onClose={() => setShowCompleteSnackbar(false)}
      >
        <Alert severity="success">엑셀 파일을 다운로드했습니다.</Alert>
      </Snackbar>
      <DataGrid
        loading={isLoading}
        rows={promptGatherings ?? []}
        columns={columns}
        // isRowSelectable={(params) => {
        //   return params.row.feedback !== 'Bad'
        // }}
        getEstimatedRowHeight={() => 100}
        getRowHeight={() => 'auto'}
        slots={{
          toolbar: () => CustomToolbar(handleExportExcel)
        }}
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
    </>
  )
}
