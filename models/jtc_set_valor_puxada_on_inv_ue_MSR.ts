/**
 * @NAPIVersion 2.x
 * @NModuleScope public
 */


import { EntryPoints } from 'N/types'
import * as log from 'N/log'
import * as record from 'N/record'
import { constant as CTS } from '../module/jtc_relatorio_vendas_CTS'

export const beforeSubmit = (ctx: EntryPoints.UserEvent.beforeSubmitContext) => {
    try {
        const curr = ctx.newRecord

        const idSalesOrder = curr.getValue(CTS.INVOICE.CREATEFROM)

        const recSalesOrder = record.load({
            type: record.Type.SALES_ORDER,
            id: idSalesOrder
        })

        const valor_puxada = recSalesOrder.getValue(CTS.SALES_ORDER.PUXADA)
        log.debug("valor_puxada", valor_puxada)

        if (!!valor_puxada) {
            curr.setValue({fieldId: CTS.INVOICE.PUXADA, value: valor_puxada})
        }

    } catch(e) {
        log.error('jtc_set_valor_puxada_on_inv_MSR.beforeSubmit', e)
    }
}