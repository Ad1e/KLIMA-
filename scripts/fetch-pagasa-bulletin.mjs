import pagasaPdf from '@pagasa-parser/source-pdf';

const PagasaParserPDFSource = pagasaPdf.default;

async function getTyphoonData() {
  const url = 'https://pubfiles.pagasa.dost.gov.ph/tamss/weather/bulletin.pdf';
  try {
    const reader = new PagasaParserPDFSource(url);
    const bulletin = await reader.parse();

    console.log('Storm Name:', bulletin?.cyclone?.name ?? 'N/A');
    console.log('Advisory Number:', bulletin?.advisory_number ?? 'N/A');
    console.log('Issued At:', bulletin?.issued_at ?? 'N/A');
    console.log('Signal Levels:', bulletin?.signals ?? []);

    const manilaSignal = bulletin?.signals?.find((signal) =>
      signal?.areas?.some((area) => area?.name === 'Metro Manila'),
    );

    if (manilaSignal) {
      console.log(`Metro Manila is under Signal #${manilaSignal.level}`);
    } else {
      console.log('Metro Manila has no active signal in this bulletin.');
    }
  } catch (error) {
    const message = String(error?.message ?? error);
    if (message.toLowerCase().includes('java')) {
      console.error('Error parsing bulletin: Java is required by @pagasa-parser/source-pdf.');
      console.error('Install Java JRE/JDK and ensure `java` is available in PATH, then run `npm run pagasa:bulletin` again.');
    } else {
      console.error('Error parsing bulletin:', error);
    }
    process.exitCode = 1;
  }
}

void getTyphoonData();
