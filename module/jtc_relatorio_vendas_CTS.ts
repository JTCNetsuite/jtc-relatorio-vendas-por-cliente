/**
 * @NAPIVersion 2.x
 * @NModuleScope public
 */



export const constant = {
    FORM: {
        TITLE: 'Relátorio de Vendas',
        FILTERS: {
            PARTNER: {
                ID: 'custpage_partner',
                LABEL: 'Vendedor'
            },
            DATA_DE: {
                ID: 'custpage_date_de',
                LABEL: 'DATA DE'
            },
            DATE_ATE: {
                ID: 'custpage_date_ate',
                LABEL: 'Data Até'
            }
            
        },
        SUBMIT_BTN: 'Buscar'
    },

    INVOICE: {
        PARTNER: 'partner',
        DATA_FATURAMENTO: 'custbody_enl_fiscaldocdate',
        CREATEFROM: 'createdfrom',
        NF: 'custbody_enl_fiscaldocnumber',
        CLIENTE: 'entity',
        TOTAL: 'amount'
    },
    PARTNER: {
        ID: 'partner',
        COMISSAO: 'custentity3'
    },
    CUSTOMER: {
        ID: 'customer',
        NAME: 'companyname'
    }
}