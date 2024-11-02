import { ControlSchemaV1 } from '../../../../desktop/src/http-server/models';
import { glossary } from './glossary';

const attributesRoadmapAssistRole = `Role:
You are an expert CPA specifically designed to assist in writing internal controls that address the control objective specified. Your objective is to use background information for a control to create a short roadmap consisting of the number of attributes you think this control should have and a 1 line description of what each attribute is.`;

const attributesRoadmapAssistTask = `Task:
Write a short roadmap consisting of the number of attributes you think this control should have and then a 1 line description of each attribute. Take pride in your work and do your best to adhere exactly to these instructions. The company's bottom line depends on it.`;

const attributesRoadmapAssistExamples = `Desired Output Examples:

Example 1:
"Based on the control form and description provided, this control should have 3 attributes:
IPC Attribute A: Validate and document appropriateness of SAP report parameters and reconcile GL totals to subledger details.
Attribute B: Evaluation of journal entry accuracy through review of documentation, clerical checks, and account allocations.
Attribute C: Quarterly review and sign-off on account receivable reconciliations by the control owner."

Example 2:
"Based on the control form and description provided, this control should have 2 attributes:
Attribute A: Analysis of sales report parameters and cross-referencing totals for review and documentation of accuracy and completeness.
Attribute B: Reconciliation of cash receipts with bank statements, remittance advice, and customer invoices, including special handling for consignment sales. "`;

export const attributesRoadmapAssistSystemPrompt = `${attributesRoadmapAssistRole}

${glossary}

${attributesRoadmapAssistTask}

${attributesRoadmapAssistExamples}`;

export function getAttributesRoadmapAssistUserPrompt(f: ControlSchemaV1['value']['form']) {
  const errorMessage = validateFormForAttributesRoadmap(f);
  if (errorMessage) {
    return { success: false, message: errorMessage };
  }

  const userPrompt = `Task:
Write control attributes using the glossary, control form, control description, attribute examples, and guide provided. Be business professional in your responses. Take pride in your work and do your best to adhere exactly to these instructions. The company's bottom line depends on it.

Control Form:
Name: ${f.name}
General Process Category: ${f.generalProcessCategory}
Objective: ${f.objective}
Control type: ${f.type}
${f.type === 'itdm' && !!f.ipc ? `IPC: ${f.ipc}` : ''}
Frequency: ${f.frequency}
${!!f.judgement ? `Judgement/complexity: ${f.judgement}` : ''}
${!!f.quantitativeThesholds ? `Quantitative Thresholds: ${f.quantitativeThesholds}` : ''}
${!!f.qualitativeThresholds ? `Qualitative Thresholds: ${f.qualitativeThresholds}` : ''}
${!!f.investigationProcess ? `Investigation and resolution procedures: ${f.investigationProcess}` : ''}

Control Description:
${f.description}`;

  return {
    success: true,
    message: userPrompt,
  };
};

/**
 * Determines whether a user can proceed to the "Attributes Roadmap Assistant" page.
 * @return {string[]} where each string is an invalid field.
 * @returns {null} if all fields are valid.
 */
export function validateFormForAttributesRoadmap(
  f: ControlSchemaV1['value']['form']
) {
  const invalidFields: string[] = [];

  if (!f.generalProcessCategory) {
    invalidFields.push('General Process Category');
  }
  if (!f.objective) {
    invalidFields.push('Objective');
  }
  if (!f.type) {
    invalidFields.push('Control Type');
  }
  if (!f.frequency) {
    invalidFields.push('Frequency');
  }
  if (!f.description) {
    invalidFields.push('Description');
  }

  if (invalidFields.length > 0) {
    return `Needed fields: ${invalidFields.join(', ')}`;
  }

  return null;
}
