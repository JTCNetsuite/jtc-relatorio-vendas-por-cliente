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
import * as email from 'N/email'
import * as file from 'N/file'


export const onRequest = (ctx: EntryPoints.Suitelet.onRequestContext) => {
    try {
        const form = UI.createForm({
            title: CTS.FORM.TITLE
        })

        form.clientScriptModulePath = '../controllers/jtc_relatorio_vendas_cliente_CS.js'

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

        const checkEnmail = form.addField({
            id: CTS.FORM.FILTERS.ENVIO_EMAIL.ID,
            label: CTS.FORM.FILTERS.ENVIO_EMAIL.label,
            type: UI.FieldType.CHECKBOX
        })

        const emails = form.addField({
            id: CTS.FORM.FILTERS.EMAIL.ID,
            label: CTS.FORM.FILTERS.EMAIL.label,
            type: UI.FieldType.TEXT
        })

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
        const email_check = body.custpage_enviar_email
        const partner_emails = String(body.custpage_email).split(";")

        

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
                search.createColumn({name:CTS.PARTNER.COMISSAO, join: CTS.PARTNER.ID}),
                search.createColumn({name: CTS.INVOICE.PUXADA})

            ]
        }).run().getRange({start: 0, end: 1000})

        log.debug('searchInvoide', searchInvoice.length)

        const page = pageHtml(searchInvoice, partner_diplay, data_de, data_ate)

        if (email_check == "T" || email_check == true) {
           
            const createFile = file.create({
                name: 'relatorio.html',
                fileType: file.Type.HTMLDOC,
                contents: page,
                folder: 964,
                isOnline: true
            }).save()
            const urlfile = file.load({id: createFile}).url

            log.audit("filed", createFile )

            const body = `Relatório de vendas <br></br>
            Periódo: de ${data_de}  até ${data_ate}<br></br>
            <br></br>
            <a href="${urlfile}">link para o relatório</a>
            `

            email.send({
                author: 192,
                subject: 'Relatório de Vendas',
                body: body,
                recipients: partner_emails
            })
        }

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
        var com
        com = invoices[i].getValue({name: CTS.PARTNER.COMISSAO, join: CTS.PARTNER.ID})

        const valor_puxada = Number(invoices[i].getValue({name: CTS.INVOICE.PUXADA}))
        log.debug("valor", valor_puxada)
        var com_em_porcem = Number(String(com).split("%")[0]) / 100
        var comissao 
        if (!!valor_puxada) {
            
            const valor_liq_puxada = valor_puxada * 0.8
            const valor_total_sem_puxada = valor - valor_puxada
            
            const comissao_sem_puxada = valor_total_sem_puxada * com_em_porcem
            const total_comissao = comissao_sem_puxada + valor_liq_puxada

            com = Number((total_comissao / valor) * 100).toFixed(2)
            log.debug('com puxada', com)
            comissao =  valor * (com / 100)         
            com = String(com)+"%"

           
        } else {
            comissao = valor * com_em_porcem
        }

        

        
        
        // const salesOrderId = invoices[i].getValue({name: CTS.INVOICE.CREATEFROM})
        
        // const recSalesOrder = record.load({
            //     type: record.Type.SALES_ORDER,
            //     id:salesOrderId
            // })
            
            // const valor_puxada = recSalesOrder.getValue(CTS.SALES_ORDER.PUXADA)
            
            // log.debug("valor")
            
            
        
            
        

            
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