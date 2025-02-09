import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [transactions, setTransactions] = useState<any[]>([])
  const [isEmployeesLoading, setIsEmployeesLoading] = useState(true)
  const [isAtEndOfData, setIsAtEndOfData] = useState(false)

  const transactionsData = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee ?? [],
    [paginatedTransactions, transactionsByEmployee]
  )

  const loadAllTransactions = useCallback(async () => {
    transactionsByEmployeeUtils.invalidateData()

    await employeeUtils.fetchAll()
    await paginatedTransactionsUtils.fetchAll()
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData()
      await transactionsByEmployeeUtils.fetchById(employeeId)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])

  useEffect(() => {
    if (employeeUtils.loading) {
      setIsEmployeesLoading(true)
    } else if (employees !== null) {
      setIsEmployeesLoading(false)
    }
  }, [employeeUtils.loading, employees])

  useEffect(() => {
    console.log(paginatedTransactions);
  
    setTransactions((prevTransactions) => [...prevTransactions, ...transactionsData])
  
    if (paginatedTransactions?.nextPage === null) {
      setIsAtEndOfData(true);
    } else {
      setIsAtEndOfData(false);
    }
  }, [transactionsData, paginatedTransactions]);

  const isViewMoreVisible = useMemo(() => {
    return transactions !== null && !transactionsByEmployee && !isAtEndOfData
  }, [transactions, transactionsByEmployee, isAtEndOfData])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isEmployeesLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null || newValue.id === EMPTY_EMPLOYEE.id) {
              await loadAllTransactions()
            } else {
              await loadTransactionsByEmployee(newValue.id)
            }
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} />

          {isViewMoreVisible && (
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading || isAtEndOfData}
              onClick={async () => {
                await loadAllTransactions()
              }}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}
