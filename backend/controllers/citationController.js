const citationService = require('../services/citationService');
const Citation = require('../models/Citation');

/**
 * @desc    Resolve DOI to metadata & formatted styles
 * @route   GET /api/citations/lookup
 * @access  Private
 */
exports.lookupDOI = async (req, res) => {
  try {
    const { doi } = req.query;
    if (!doi) {
      return res.status(400).json({ success: false, message: 'DOI query parameter is required' });
    }

    const metadata = await citationService.resolveDOI(doi);
    const styles = citationService.formatAllStyles(metadata);

    return res.json({
      success: true,
      data: {
        metadata,
        styles,
      },
    });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Save citation to user library
 * @route   POST /api/citations
 * @access  Private
 */
exports.saveCitation = async (req, res) => {
  try {
    const { doi, title, authors, journal, publisher, year, volume, issue, pages, url, noteId, tags } = req.body;

    const citation = await Citation.create({
      userId: req.user.id,
      doi,
      title,
      authors: authors || [],
      journal,
      publisher,
      year,
      volume,
      issue,
      pages,
      url,
      bibtex: citationService.formatBibTeX({ authors, title, journal, year, volume, issue, pages, doi, url }),
      noteId,
      tags: tags || [],
    });

    const styles = citationService.formatAllStyles(citation);

    return res.status(201).json({
      success: true,
      data: {
        citation,
        styles,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get user citations library
 * @route   GET /api/citations
 * @access  Private
 */
exports.getUserCitations = async (req, res) => {
  try {
    const { search, tag } = req.query;
    const where = { userId: req.user.id };

    const citations = await Citation.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    const enriched = citations.map((c) => ({
      ...c.toJSON(),
      styles: citationService.formatAllStyles(c),
    }));

    return res.json({
      success: true,
      count: enriched.length,
      data: enriched,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Export bibliography file (.bib or .ris)
 * @route   GET /api/citations/export
 * @access  Private
 */
exports.exportBibliography = async (req, res) => {
  try {
    const { format = 'bibtex' } = req.query;
    const citations = await Citation.findAll({ where: { userId: req.user.id } });

    if (format === 'ris') {
      const risData = citationService.generateRIS(citations);
      res.setHeader('Content-Type', 'application/x-research-info-systems');
      res.setHeader('Content-Disposition', 'attachment; filename="openprep-references.ris"');
      return res.send(risData);
    }

    const bibtexData = citations.map((c) => citationService.formatBibTeX(c)).join('\n\n');
    res.setHeader('Content-Type', 'application/x-bibtex');
    res.setHeader('Content-Disposition', 'attachment; filename="openprep-references.bib"');
    return res.send(bibtexData);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
