/**
 * @NAPIVersion 2.x
 * @NScriptType ClientScript
 */


import { EntryPoints } from 'N/types'
import * as MSR from '../models/jtc_ralorio_vendas_func_CS'
import * as log from 'N/log'

export const fieldChanged: EntryPoints.Client.fieldChanged = (ctx: EntryPoints.Client.fieldChangedContext) => {
    try {
        
        MSR.fieldChanged(ctx)

    }catch(e) {
        log.error("jtc_relatorio_vendas_cliente_CS.fieldChanged", e)
    }
}


