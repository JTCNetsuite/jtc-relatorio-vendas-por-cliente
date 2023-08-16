/**
 * @NAPIVersion 2.x
 * @NModuleScope public
 */

import { EntryPoints } from 'N/types'
import * as UI from 'N/ui/serverWidget'
import * as log from 'N/log'
import { constant as CTS } from '../module/jtc_relatorio_vendas_CTS'
import * as record from 'N/record'
import * as search from 'N/search'


export const onRequest = (ctx: EntryPoints.Suitelet.onRequestContext) => {
    try {
        const form = UI.createForm({
            title: CTS.FORM.TITLE
        })

        if (ctx.request.method == "GET") {
            getForm(form, ctx)
        } else {
            postForm(form, ctx)
        }

    } catch (error) {
        log.error('jtc_relatorio_vendas_MSR.onRequest', error)
    }
}



const getForm = (form: UI.Form, ctx: EntryPoints.Suitelet.onRequestContext) => {
    try {

        const partner = form.addField({
            id: CTS.FORM.FILTERS.PARTNER.ID,
            label: CTS.FORM.FILTERS.PARTNER.LABEL,
            type: UI.FieldType.SELECT,
            source: String(record.Type.PARTNER)
        }).isMandatory = true


        const data_de = form.addField({
            id: CTS.FORM.FILTERS.DATA_DE.ID,
            label: CTS.FORM.FILTERS.DATA_DE.LABEL,
            type:  UI.FieldType.DATE
        })

        const data_ate = form.addField({
            id: CTS.FORM.FILTERS.DATE_ATE.ID,
            label: CTS.FORM.FILTERS.DATE_ATE.LABEL,
            type:  UI.FieldType.DATE
        })
        form.addSubmitButton({
            label: CTS.FORM.SUBMIT_BTN
        })

        ctx.response.writePage(form)

        
    } catch (error) {
        log.error('jtc_relatorio_vendas_MSR.getForm', error)
    }
}


const postForm = (form: UI.Form, ctx: EntryPoints.Suitelet.onRequestContext)  => {
    try {
        log.debug('ctx', ctx.request.parameters)
        const body = ctx.request.parameters
        const parter = body.custpage_partner
        const data_de = body.custpage_date_de
        const data_ate = body.custpage_date_ate
        const partner_diplay = body.custpage_partner_display

        const filters = []

        if (!!parter) {
            filters.push([
                CTS.INVOICE.PARTNER, search.Operator.ANYOF, parter
            ])
            filters.push("AND")
        }

        if (!!data_de && !!data_ate) {
            filters.push([
                CTS.INVOICE.DATA_FATURAMENTO, search.Operator.WITHIN, data_de, data_ate
            ])
            filters.push("AND")
        } else if (!!data_de) {
            filters.push([
                CTS.INVOICE.DATA_FATURAMENTO, search.Operator.AFTER, data_de
            ])
            filters.push("AND")
        } else if(!!data_ate) {
            filters.push([
                CTS.INVOICE.DATA_FATURAMENTO, search.Operator.BEFORE, data_ate
            ])
            filters.push("AND")
        }


        filters.push(["mainline", search.Operator.IS, "T"])

        log.debug('filters', filters)

        const searchInvoice = search.create({
            type: search.Type.INVOICE,
            filters: filters,
            columns: [
                search.createColumn({name: CTS.INVOICE.CREATEFROM}),
                search.createColumn({name: CTS.CUSTOMER.NAME, join: CTS.CUSTOMER.ID}),
                search.createColumn({name:CTS.INVOICE.NF}),
                search.createColumn({name:CTS.INVOICE.DATA_FATURAMENTO}),
                search.createColumn({name:CTS.INVOICE.TOTAL}),
                search.createColumn({name:CTS.PARTNER.COMISSAO, join: CTS.PARTNER.ID})

            ]
        }).run().getRange({start: 0, end: 1000})

        log.debug('searchInvoide', searchInvoice.length)

        const page = pageHtml(searchInvoice, partner_diplay, data_de, data_ate)



        ctx.response.write(page)
        
    } catch (error) {
        log.error('jtc_relatorio_vendas_MSR.postForm', error)
    }
}



const pageHtml = (invoices: search.Result[], partner: string, data_de, data_ate) => {

    var html = `<!DOCTYPE html>
    <html lang="pt-br">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relatório</title>
        <style>
           
            * {
                font-family: Arial;
                // padding: 1px;
                // margin: 0;
            }
            table {
                width: 100%;
               
            }
            th {
                font-size: 15px
            }
            td {
                border-bottom: 1px solid black;
            }
            
        </style>
    </head>
    <body>
    <h1>Relatório de Vendas</h1>
    <p>Vendedor: ${partner} </p>
    <p>Período: de ${data_de}  até ${data_ate}</p>
    <table style=" border-collapse: collapse;"> 
    <tr>
        <th>PEDIDO</th>
        <th>N.F.</th>
        <th>CLIENTE</th>
        <th>D. FAT</th>
        <th>$ TOTAL</th>
        <th>% COM</th>
        <th>$ COMISSÀO</th>
    </tr>
    `

    let total_sum = 0
    let total_comissao = 0

    for (var i=0; i < invoices.length; i++) {
        const valor = Number(invoices[i].getValue({name: CTS.INVOICE.TOTAL}))
        const saleorderNum = String(invoices[i].getText({name: CTS.INVOICE.CREATEFROM})).split('#')[1]

        const com = invoices[i].getValue({name: CTS.PARTNER.COMISSAO, join: CTS.PARTNER.ID})

        var com_em_porcem = Number(String(com).split("%")[0]) / 100
        var comissao = valor * com_em_porcem

        total_comissao += comissao

        total_sum += valor

        html += '<tr>'

        html += `<td><strong>${saleorderNum}<strong></td>`
        html += `<td>${invoices[i].getValue({name: CTS.INVOICE.NF})}</td>`
        html += `<td style="font-size: 16px">${invoices[i].getValue({name: CTS.CUSTOMER.NAME, join: CTS.CUSTOMER.ID})}</td>`
        html += `<td>${invoices[i].getValue({name: CTS.INVOICE.DATA_FATURAMENTO})}</td>`
        html += `<td style="text-align: end;">${formatarMoeda(valor)}</td>`
        html += `<td style="text-align: end;">${com}</td>`
        html += `<td style="text-align: end;">${formatarMoeda(comissao)}</td>`

        html += '</tr>'

    }
    html += `<tr>
        <td colspan="4" style="text-align: center;"><strong>Total<strong></td>
        <td style="text-align: end;">${formatarMoeda(total_sum)} </td>
        <td></td>
        <td style="text-align: end;">${formatarMoeda(total_comissao)}</td>
        
    </tr>`
    html += '</table>'

    html += `</body></html>`

    return html

}

const formatarMoeda = (valor) => {
    const partes = valor.toFixed(2).split('.');
    partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
    return `${partes.join(',')}`;
  }