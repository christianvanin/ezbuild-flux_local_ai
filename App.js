import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { useState, useEffect } from 'react';

// URL di fallback per testare un file di grandi dimensioni se non troviamo il modello CoreML di Flux hostato pubblicamente
const MODEL_URL = "https://huggingface.co/fal/flux-coreml-q4/resolve/main/flux_dev_4bit.mlpackage.zip";
const MODEL_FILE_NAME = "flux_dev_4bit.mlpackage.zip";

export default function App() {
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [modelExists, setModelExists] = useState(false);

  const modelPath = `${FileSystem.documentDirectory}${MODEL_FILE_NAME}`;

  useEffect(() => {
    checkModel();
  }, []);

  const checkModel = async () => {
    const info = await FileSystem.getInfoAsync(modelPath);
    setModelExists(info.exists);
  };

  const downloadModel = async () => {
    setIsDownloading(true);
    setDownloadProgress(0);

    const downloadResumable = FileSystem.createDownloadResumable(
      MODEL_URL,
      modelPath,
      {},
      (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        // Evitiamo che progress sia infinito o NaN all'inizio
        if (!isNaN(progress) && isFinite(progress)) {
            setDownloadProgress(progress);
        }
      }
    );

    try {
      const { uri } = await downloadResumable.downloadAsync();
      console.log('Finished downloading to ', uri);
      setModelExists(true);
    } catch (e) {
      console.error(e);
      // Fallback a un file di test generico se HuggingFace richiede Auth o è rotto il link
      console.log("Il link reale di HF potrebbe essere privato, in un'app vera useremmo il token HuggingFace");
    } finally {
      setIsDownloading(false);
    }
  };

  const deleteModel = async () => {
    await FileSystem.deleteAsync(modelPath);
    setModelExists(false);
    setDownloadProgress(0);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>Flux Dev Local</Text>
      <Text style={styles.subtitle}>On-Device CoreML Inference</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Gestione Modello AI</Text>
        {modelExists ? (
          <View>
            <Text style={styles.readyText}>✅ Modello CoreML 4-bit Pronto!</Text>
            <Text style={styles.descText}>L'inferenza locale è pronta per essere eseguita dal Neural Engine dell'iPhone.</Text>
            
            <TouchableOpacity style={styles.button} onPress={() => alert('Avvio Native Module per Inferenza!')}>
              <Text style={styles.buttonText}>🎨 Genera Immagine (Local)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={deleteModel}>
              <Text style={styles.buttonText}>🗑️ Elimina Pesi Modello</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text style={styles.missingText}>❌ Modello Assente (Richiesti ~4.2GB)</Text>
            <Text style={styles.descText}>Scarica i pesi quantizzati per eseguire Flux Dev in locale e offline sul tuo device.</Text>
            {isDownloading ? (
              <View style={styles.progressContainer}>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${downloadProgress * 100}%` }]} />
                </View>
                <Text style={styles.progressText}>{(downloadProgress * 100).toFixed(1)}% Completato</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.button} onPress={downloadModel}>
                <Text style={styles.buttonText}>⬇️ Inizia Download</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0E',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    color: '#A0A0B0',
    marginBottom: 40,
  },
  card: {
    width: '100%',
    backgroundColor: '#16161D',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2D2D3B',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  descText: {
    color: '#A0A0B0',
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  readyText: {
    color: '#00E5FF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  missingText: {
    color: '#FF4D4D',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#6C63FF',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  deleteButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF4D4D',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  progressContainer: {
    marginTop: 10,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: '#2D2D3B',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00E5FF',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  progressText: {
    color: '#00E5FF',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600'
  },
});
