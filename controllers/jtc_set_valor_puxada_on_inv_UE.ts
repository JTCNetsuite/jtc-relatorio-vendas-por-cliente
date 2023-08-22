/**
 * @NAPIVersion 2.x
 * @NScriptType UserEventScript
 */


import { EntryPoints } from 'N/types'
import * as MSR from "../models/jtc_set_valor_puxada_on_inv_ue_MSR"
import * as log from "N/log"

export const beforeSubmit: EntryPoints.UserEvent.beforeSubmit = (ctx: EntryPoints.UserEvent.beforeSubmitContext) => {
    try {
        if (ctx.type == ctx.UserEventType.CREATE || ctx.type == ctx.UserEventType.EDIT) {

            MSR.beforeSubmit(ctx)
        }
    } catch (e) {
        log.error("jtc_set_valor_puxada_UE.beforeSubmit", e)
    }
}