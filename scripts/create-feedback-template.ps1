param()
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
$projectRoot = Split-Path -Parent $PSScriptRoot
$outputPath = Join-Path $projectRoot 'docs/user-testing-template.xlsx'
$headers = ([System.IO.File]::ReadAllText((Join-Path $projectRoot 'docs/user-testing-template.csv'), [System.Text.Encoding]::UTF8).Trim() -split ',')
if ($headers.Count -ne 9) { throw 'The feedback worksheet requires nine columns.' }
function TextCell([string]$Reference, [string]$Text, [int]$Style = 1) {
    $escaped = [System.Security.SecurityElement]::Escape($Text)
    return "<c r=`"$Reference`" s=`"$Style`" t=`"inlineStr`"><is><t xml:space=`"preserve`">$escaped</t></is></c>"
}
$headerCells = for ($index = 0; $index -lt $headers.Count; $index++) { TextCell "$([char](65 + $index))1" $headers[$index] 2 }
$rows = @("<row r=`"1`" ht=`"44`" customHeight=`"1`">$($headerCells -join '')</row>")
for ($row = 2; $row -le 21; $row++) {
    $style = if ($row % 2 -eq 0) { 3 } else { 1 }
    $cells = for ($column = 0; $column -lt 9; $column++) { TextCell "$([char](65 + $column))$row" '' $style }
    $rows += "<row r=`"$row`" ht=`"72`" customHeight=`"1`">$($cells -join '')</row>"
}
$instructions = @(
    'Attention 实验室试用记录填写说明',
    '一位参与者填写一行。使用 P01、P02 等匿名编号，不填写姓名、手机号或账号。',
    '之前是否了解过注意力机制：下拉选择是、否或不确定，也可以填写具体背景。',
    '首次自测成绩：使用得分/总题数，例如 3/5。重试自测成绩单独填写；没有重试则留空。',
    '学习后理解是否加深：填写参与者自己的判断，可选是、否或不确定，也可输入具体描述。',
    '困惑的步骤：描述在哪里卡住、哪里看不懂；如有人提供帮助，也在这里注明。',
    '最有帮助的部分与改进建议：尽量保留参与者原话，长内容会自动换行。',
    '导出文件名：填写实际提供的 JSON 文件名，例如 P01-learning.json；没有提供则留空。',
    '记录表保留了中文 CSV 的九列，成绩列采用文本格式，避免 Excel 把 3/5 识别为日期。',
    '首行冻结，支持筛选和交替底色。可拖动行高显示较长反馈，超过 20 位时继续添加行。',
    '下拉菜单仅作提示，允许填写自己的描述；没有观察到或没有回答的项目留空，不填猜测。',
    '首次与重试题组可能不同，分数不能直接解释为学习提升；理解加深是主观感受。',
    '本文件是空白模板。收集到的个人反馈和学习记录保存在本地，由参与者决定是否分享。'
)
$instructionRows = for ($index = 0; $index -lt $instructions.Count; $index++) {
    $row = $index + 1
    $style = if ($index -eq 0) { 2 } else { 1 }
    "<row r=`"$row`" ht=`"45`" customHeight=`"1`">$(TextCell "A$row" $instructions[$index] $style)</row>"
}
$files = @{
    '[Content_Types].xml' = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>
'@
    '_rels/.rels' = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>
'@
    'xl/workbook.xml' = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets><sheet name="试用记录" sheetId="1" r:id="rId1"/><sheet name="填写说明" sheetId="2" r:id="rId2"/></sheets></workbook>
'@
    'xl/_rels/workbook.xml.rels' = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>
'@
    'xl/styles.xml' = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Microsoft YaHei"/><color rgb="FF344054"/></font><font><b/><sz val="11"/><name val="Microsoft YaHei"/><color rgb="FFFFFFFF"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF7560DF"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF5F2FC"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border/><border><left style="thin"><color rgb="FFE4E7EC"/></left><right style="thin"><color rgb="FFE4E7EC"/></right><top style="thin"><color rgb="FFE4E7EC"/></top><bottom style="thin"><color rgb="FFE4E7EC"/></bottom></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="49" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="49" fontId="1" fillId="2" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" horizontal="center" wrapText="1"/></xf><xf numFmtId="49" fontId="0" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>
'@
    'xl/worksheets/sheet1.xml' = "<?xml version=`"1.0`" encoding=`"UTF-8`" standalone=`"yes`"?><worksheet xmlns=`"http://schemas.openxmlformats.org/spreadsheetml/2006/main`"><dimension ref=`"A1:I21`"/><sheetViews><sheetView workbookViewId=`"0`"><pane ySplit=`"1`" topLeftCell=`"A2`" activePane=`"bottomLeft`" state=`"frozen`"/><selection pane=`"bottomLeft`" activeCell=`"A2`" sqref=`"A2`"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight=`"20`"/><cols><col min=`"1`" max=`"1`" width=`"14`" customWidth=`"1`"/><col min=`"2`" max=`"2`" width=`"22`" customWidth=`"1`"/><col min=`"3`" max=`"4`" width=`"16`" customWidth=`"1`"/><col min=`"5`" max=`"5`" width=`"27`" customWidth=`"1`"/><col min=`"6`" max=`"8`" width=`"40`" customWidth=`"1`"/><col min=`"9`" max=`"9`" width=`"30`" customWidth=`"1`"/></cols><sheetData>$($rows -join '')</sheetData><autoFilter ref=`"A1:I21`"/><dataValidations count=`"2`"><dataValidation type=`"list`" allowBlank=`"1`" showInputMessage=`"1`" showErrorMessage=`"0`" promptTitle=`"按真实情况填写`" prompt=`"可从下拉菜单选择，也可输入自己的描述。`" sqref=`"B2:B21`"><formula1>&quot;是,否,不确定&quot;</formula1></dataValidation><dataValidation type=`"list`" allowBlank=`"1`" showInputMessage=`"1`" showErrorMessage=`"0`" promptTitle=`"参与者的主观判断`" prompt=`"可选是、否、不确定，也可输入具体说明。`" sqref=`"E2:E21`"><formula1>&quot;是,否,不确定&quot;</formula1></dataValidation></dataValidations><pageMargins left=`"0.25`" right=`"0.25`" top=`"0.5`" bottom=`"0.5`" header=`"0.2`" footer=`"0.2`"/><pageSetup orientation=`"landscape`"/></worksheet>"
    'xl/worksheets/sheet2.xml' = "<?xml version=`"1.0`" encoding=`"UTF-8`" standalone=`"yes`"?><worksheet xmlns=`"http://schemas.openxmlformats.org/spreadsheetml/2006/main`"><dimension ref=`"A1:A$($instructions.Count)`"/><sheetViews><sheetView workbookViewId=`"0`"/></sheetViews><sheetFormatPr defaultRowHeight=`"20`"/><cols><col min=`"1`" max=`"1`" width=`"110`" customWidth=`"1`"/></cols><sheetData>$($instructionRows -join '')</sheetData></worksheet>"
}
$stream = [System.IO.File]::Open($outputPath, [System.IO.FileMode]::Create)
$archive = [System.IO.Compression.ZipArchive]::new($stream, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($name in ($files.Keys | Sort-Object)) {
        [xml]$null = $files[$name]
        $entry = $archive.CreateEntry($name)
        $entry.LastWriteTime = [DateTimeOffset]::new(2026, 10, 8, 0, 0, 0, [TimeSpan]::Zero)
        $writer = [System.IO.StreamWriter]::new($entry.Open(), [System.Text.UTF8Encoding]::new($false))
        try { $writer.Write($files[$name]) } finally { $writer.Dispose() }
    }
} finally { $archive.Dispose(); $stream.Dispose() }
Write-Output "Created blank feedback workbook: $outputPath"
