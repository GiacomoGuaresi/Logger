import { ArchivioInMemoria } from './archivioInMemoria'
import { verificaContratto } from './contratto'

verificaContratto(async () => new ArchivioInMemoria())
