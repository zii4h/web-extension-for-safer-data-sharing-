# JITO 

> Privacy, Before You Upload.

JITO adds a review step before you attach supported files to a website. It checks files on your device for certain text patterns and image metadata, then lets you review what it found and prepare a cleaned copy.

Your original file stays on your device. JITO only passes a cleaned copy to the website when you choose **Attach cleaned copy**.

## HOW TO RUN:

1. Download and extract the latest JITO release.
2. In Edge or Chrome, open the extensions page and turn on **Developer mode**.
3. Choose **Load unpacked** and select the `jito` folder containing `manifest.json`.
4. Open a website, click the JITO extension icon, and choose **Enable JITO on this site**.
5. Refresh the website. Start an upload and review the file in JITO before attaching the cleaned copy.

## SUPPORTED FILES:

Currently supports `JPEG` and static `PNG` images, plus `TXT`, `MD`, `CSV`, and `LOG` text files. It does not support PDF or Office files.

JITO is an early test version. Some websites or upload methods may not work with it. A clean result does not guarantee that a file contains no sensitive information. Please test with sample files that do not contain private information.


> Start with the included sample file to explore JITO’s findings, redaction choices, and sharing-copy preview.

[![Made with Codex](https://img.shields.io/badge/Made%20with-Codex-111111?style=for-the-badge&logo=openai&logoColor=white&labelColor=702033)](https://openai.com/codex/)

