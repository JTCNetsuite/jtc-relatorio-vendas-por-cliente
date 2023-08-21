/**
 * @NAPIVersion 2.x
 * @NModuleScope public
 */



import { EntryPoints } from 'N/types'
import * as search from 'N/search'
import { constant as CTS } from '../module/jtc_relatorio_vendas_CTS'

export const fieldChanged = (ctx: EntryPoints.Client.fieldChangedContext) => {
    if (ctx.fieldId == CTS.FORM.FILTERS.PARTNER.ID) {
        
        const parter = ctx.currentRecord.getValue(CTS.FORM.FILTERS.PARTNER.ID)


        const searchParter = search.create({
            type: search.Type.PARTNER,
            filters: ["internalid", search.Operator.ANYOF, parter],
            columns: [
                search.createColumn({name: CTS.PARTNER.EMAIL})
            ]
        }).run().getRange({start: 0, end: 1})

        if (searchParter.length > 0)  {
            const email = searchParter[0].getValue({name: CTS.PARTNER.EMAIL})
            ctx.currentRecord.setValue({fieldId: CTS.FORM.FILTERS.EMAIL.ID, value: `${email};`})
        }

    }
}

