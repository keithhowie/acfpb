import { firestore } from 'firebase-admin';
import * as md from 'markdown-it';
import { Util } from './util';
import * as moment from 'moment';
import * as _ from 'lodash';

const PdfPrinter = require('pdfmake/src/printer.js');
const fonts = {
  CenturyGothic: {
    normal: 'fonts/GOTHIC.TTF',
    bold: 'fonts/GOTHICB.TTF',
    italics: 'fonts/GOTHICI.TTF',
    bolditalics: 'fonts/GOTHICBI.TTF.ttf'
  }
};
const printer = new PdfPrinter(fonts);

export class PdfHelper {
  static async generatePdf() {

    const content = [];
    content.push(
      { text: `some text`, pageBreak: 'before' }
    );

    return {
      pageMargins: [60, 40, 60, 120],
      content: content,
      defaultStyle: {
        fontSize: 8,
        font: 'CenturyGothic',
        alignment: 'justify'
      },
      footer: [
        {
          margin: [40, 0],
          fontSize: 7,
          stack: []
        }
      ]
    };
  }

  static async render(tokens, firm, addWhitespace) {
    const result = [];
    let subSection;
    for (let i = 0; i < tokens.length; i++) {
      const currentToken = tokens[i];
      switch (currentToken.type) {
        case 'inline':
          if (currentToken.children.filter(x => x.type === 'image').length > 0) {
            result.push(...await this.render(currentToken.children, firm, addWhitespace));
          }
          else {
            result.push({ text: await this.render(currentToken.children, firm, addWhitespace) });
          }
          break;
        case 'em_open':
          subSection = this.selectUntilClosingTag(i, 'em_close', tokens);
          result.push(...(await this.render(subSection.tokens, firm, addWhitespace)).map(r => ({ ...r, italics: true })));
          i = subSection.jumpToIndex;
          break;
        case 'strong_open':
          subSection = this.selectUntilClosingTag(i, 'strong_close', tokens);
          result.push(...(await this.render(subSection.tokens, firm, addWhitespace)).map(r => ({ ...r, bold: true })));
          i = subSection.jumpToIndex;
          break;
        case 'heading_open':
          subSection = this.selectUntilClosingTag(i, 'heading_close', tokens);
          result.push(...(await this.render(subSection.tokens, firm, addWhitespace)).map(r => {
            switch (currentToken.tag) {
              case 'h1': return { ...r, bold: true, fontSize: 25 };
              case 'h2': return { ...r, bold: true, fontSize: 20 };
              case 'h3': return { ...r, bold: true, fontSize: 18 };
              case 'h4': return { ...r, bold: true, fontSize: 16 };
              case 'h5': return { ...r, bold: true, fontSize: 14 };
              case 'h6': return { ...r, bold: true, fontSize: 12 };
              default: return r;
            }
          }
          ));
          i = subSection.jumpToIndex;
          break;
        case 'bullet_list_open':
          subSection = this.selectUntilClosingTag(i, 'bullet_list_close', tokens);
          const list = await this.render(subSection.tokens, firm, false);
          if (typeof firm.bullet === 'number') {
            const ul = [];
            for (const l of list) {
              ul.push(await this.renderCustomBulletListContent(firm, l));
            }
            result.push({ type: 'none', ul: ul });
          } else {
            result.push({ ul: list });
          }
          result.push({ text: '\n' });
          i = subSection.jumpToIndex;
          break;
        case 'paragraph_open':
          subSection = this.selectUntilClosingTag(i, 'paragraph_close', tokens);
          result.push(...await this.render(subSection.tokens, firm, addWhitespace));
          if (addWhitespace) {
            result.push({ text: '\n' });
          }
          i = subSection.jumpToIndex;
          break;
        case 'link_open':
          subSection = this.selectUntilClosingTag(i, 'link_close', tokens);
          result.push(...(await this.render(subSection.tokens, firm, addWhitespace))
            .map(r => ({ ...r, link: currentToken.attrs[0][1] })));
          i = subSection.jumpToIndex;
          break;
        case 'text':
          const text = { text: currentToken.content } as any;
          if (currentToken.content && currentToken.content.length && currentToken.content.length > 1) {
            switch (currentToken.content.substr(0, 2)) {
              case '<<': text.alignment = 'left'; text.text = text.text.substr(2); break;
              case '--': text.alignment = 'center'; text.text = text.text.substr(2); break;
              case '>>': text.alignment = 'right'; text.text = text.text.substr(2); break;
            }
          }
          result.push(text);
          break;
        case 'image':
          const src = firm.images[currentToken.attrs[0][1]];
          const img = { image: currentToken.attrs[0][1], width: src.width } as any;
          switch (currentToken.content) {
            case '<<': img.alignment = 'left'; break;
            case '--': img.alignment = 'center'; break;
            case '>>': img.alignment = 'right'; break;
          }
          result.push(img);
          break;
        case 'table_open':
          break;
        case 'thead_open':
          break;
        case 'tbody_open':
          break;
        case 'tr_open':
          subSection = this.selectUntilClosingTag(i, 'tr_close', tokens);
          result.push({
            columns: (await this.render(subSection.tokens, firm, addWhitespace)).map(c => ({ width: '*', stack: [c] }))
          });
          i = subSection.jumpToIndex;
          break;
        case 'th_open':
          break;
        case 'td_open':
          subSection = this.selectUntilClosingTag(i, 'td_close', tokens);
          result.push(...await this.render(subSection.tokens, firm, addWhitespace));
          i = subSection.jumpToIndex;
          break;

        default:
          break;
      }
    }
    return result;
  }

  static selectUntilClosingTag(startIndex, closingTag, tokens) {
    const resultTokens = [];
    for (let i = startIndex + 1; i < tokens.length; i++) {
      const currentToken = tokens[i];
      if (currentToken.type === closingTag) {
        return {
          tokens: resultTokens,
          jumpToIndex: i
        };
      } else {
        resultTokens.push(currentToken);
      }
    }
    return {};
  }

  static async renderCustomBulletListContent(firm, text) {
    const src = firm.images[firm.bullet];
    return {
      table: {
        body: [[
          { image: firm.bullet.toString(), width: src.width },
          { text: text }
        ]]
      },
      layout: {
        hLineColor: function () { return 'white'; },
        vLineColor: function () { return 'white'; }
      }
    };
  }

  static numberWithCommas(x: number): string {
    return x.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  static async savePdf(pdfData, ws) {
    const pdfDoc = printer.createPdfKitDocument(pdfData);
    return new Promise((r, x) => {
      pdfDoc.pipe(ws)
        .on('error', err => x(err))
        .on('finish', () => r());
      pdfDoc.end();
    });
  }
}