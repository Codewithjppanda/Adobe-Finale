from fastapi import APIRouter, HTTPException, Body
from fastapi.responses import FileResponse
import os
import tempfile
import hashlib
from typing import List, Dict, Any
import requests
import xml.etree.ElementTree as ET

# Try to import Azure Speech SDK at module level
speechsdk = None
AZURE_SPEECH_AVAILABLE = False

def try_import_azure_sdk():
    global speechsdk, AZURE_SPEECH_AVAILABLE
    try:
        import azure.cognitiveservices.speech as sdk
        speechsdk = sdk
        AZURE_SPEECH_AVAILABLE = True
        print("✅ Azure Speech SDK imported successfully!")
        return True
    except ImportError as e:
        print(f"❌ Azure Speech SDK import failed: {e}")
        return False

# Try to import at startup
try_import_azure_sdk()


router = APIRouter()


def generate_podcast_script(selection: str, matches: List[Dict[str, Any]], insights: List[str]) -> List[Dict[str, str]]:
    """Generate a two-speaker podcast-style script for TTS"""
    
    # Script will be a list of speaker turns
    script = []
    
    # Introduction
    script.append({
        "speaker": "host",
        "text": "Welcome to Document Intelligence Insights! I'm your host, and today we're exploring some fascinating connections across your documents."
    })
    
    script.append({
        "speaker": "analyst",
        "text": f"That's right! Our reader just highlighted an interesting passage: '{selection[:100]}...' Let me show you what I found related to this."
    })
    
    # Discuss related sections
    if matches:
        script.append({
            "speaker": "host",
            "text": "So what connections did you discover across the document library?"
        })
        
        for i, match in enumerate(matches[:3], 1):
            pdf_name = match.get('pdf_name', match.get('filename', 'Unknown'))
            section = match.get('section_heading', match.get('title', 'Section'))
            relevance = match.get('relevance_reason', 'Related content')
            snippet = match.get('snippet', '')[:150]
            
            if i == 1:
                script.append({
                    "speaker": "analyst",
                    "text": f"First up, I found something really relevant in {pdf_name}, specifically in the {section} section. {relevance}. It says: '{snippet}...'"
                })
            else:
                connector = "Another interesting connection" if i == 2 else "And finally"
                script.append({
                    "speaker": "analyst",
                    "text": f"{connector} appears in {pdf_name}, under {section}. This mentions: '{snippet}...'"
                })
            
            # Host reaction
            if i == 1:
                script.append({
                    "speaker": "host",
                    "text": "That's a great connection! How does this relate to our selected text?"
                })
            elif i == 2:
                script.append({
                    "speaker": "host",
                    "text": "Interesting! I'm starting to see a pattern here."
                })
    
    # Discuss insights
    if insights:
        script.append({
            "speaker": "host",
            "text": "Based on these connections, what insights can we draw?"
        })
        
        for i, insight in enumerate(insights[:4], 1):
            if i == 1:
                script.append({
                    "speaker": "analyst",
                    "text": f"Well, here's what stands out to me: {insight}"
                })
            elif i == 2:
                script.append({
                    "speaker": "host",
                    "text": f"That's fascinating! And I also noticed that {insight}"
                })
            elif i == 3:
                script.append({
                    "speaker": "analyst",
                    "text": f"Exactly! And there's more: {insight}"
                })
            else:
                script.append({
                    "speaker": "host",
                    "text": f"One more thing worth mentioning: {insight}"
                })
    
    # Conclusion
    script.append({
        "speaker": "host",
        "text": "This has been a great exploration of how different documents connect and complement each other."
    })
    
    script.append({
        "speaker": "analyst",
        "text": "Absolutely! Remember, these connections help you build a richer understanding of your topic. Keep exploring, and happy reading!"
    })
    
    return script


@router.post("/audio/generate")
async def generate_audio(
    selection: str = Body(..., embed=True),
    matches: List[Dict[str, Any]] = Body(default=[], embed=True),
    insights: List[str] = Body(default=[], embed=True),
    voice: str = Body(default="en-US-AriaNeural", embed=True)
):
    """Generate audio/podcast from selection, matches and insights"""
    
    # Check if TTS is configured
    tts_provider = os.environ.get("TTS_PROVIDER", "")
    if tts_provider.lower() != "azure":
        return {
            "audio_url": None,
            "error": "TTS disabled. Set TTS_PROVIDER=azure and provide Azure TTS credentials to enable audio generation."
        }
    
    # We don't need Azure Speech SDK anymore - we have REST API fallback
    # Always proceed with audio generation
    
    # Check Azure TTS credentials
    azure_key = os.environ.get("AZURE_TTS_KEY")
    azure_endpoint = os.environ.get("AZURE_TTS_ENDPOINT") or os.environ.get("AZURE_TTS_REGION", "eastus")
    
    if not azure_key:
        return {
            "audio_url": None,
            "error": "Missing AZURE_TTS_KEY. Please configure Azure Text-to-Speech credentials."
        }
    
    try:
        # Generate podcast script with multiple speakers
        script_parts = generate_podcast_script(selection, matches, insights)
        
        # Define voices for speakers
        voices = {
            "host": "en-US-JennyNeural",      # Female host
            "analyst": "en-US-GuyNeural"      # Male analyst
        }
        
        # Generate audio for each part and combine
        audio_segments = []
        full_text = ""
        
        for part in script_parts:
            speaker = part["speaker"]
            text = part["text"]
            speaker_voice = voices.get(speaker, voice)
            
            # Add a small pause between speakers
            if audio_segments:
                full_text += " ... "  # Pause indicator
            full_text += text + " "
            
            # Generate audio for this segment
            audio_data = await generate_azure_tts(text, speaker_voice, azure_key, azure_endpoint)
            audio_segments.append(audio_data)
        
        # Generate 2-speaker podcast with different voices
        host_voice = "en-US-JennyNeural"      # Female host - warm, welcoming
        analyst_voice = "en-US-BrandonNeural"  # Male analyst - professional, analytical
        
        audio_segments = []
        combined_script = ""
        
        print(f"🎙️ Creating 2-speaker podcast with {len(script_parts)} segments...")
        
        # Generate each segment with appropriate speaker voice
        for i, part in enumerate(script_parts):
            speaker_name = "Host" if part["speaker"] == "host" else "Analyst"
            speaker_voice = host_voice if part["speaker"] == "host" else analyst_voice
            
            combined_script += f"[{speaker_name}]: {part['text']}\n\n"
            
            # Create speaker-specific SSML for better voice characteristics
            if part["speaker"] == "host":
                # Host: Warmer, more conversational tone
                ssml_text = f"""<speak version='1.0' xml:lang='en-US'>
                    <voice xml:lang='en-US' name='{speaker_voice}'>
                        <prosody rate='0.95' pitch='+3%' volume='85'>
                            {part['text']}
                        </prosody>
                    </voice>
                </speak>"""
            else:
                # Analyst: More professional, analytical tone
                ssml_text = f"""<speak version='1.0' xml:lang='en-US'>
                    <voice xml:lang='en-US' name='{speaker_voice}'>
                        <prosody rate='1.0' pitch='-2%' volume='90'>
                            {part['text']}
                        </prosody>
                    </voice>
                </speak>"""
            
            print(f"🎤 Generating segment {i+1}: {speaker_name} ({speaker_voice})")
            
            try:
                # Generate audio for this specific segment
                segment_audio = await generate_azure_tts_rest(
                    text=ssml_text, 
                    voice=speaker_voice, 
                    api_key=azure_key, 
                    region=azure_endpoint
                )
                
                # Add a small pause between speakers (silence)
                if i > 0:
                    pause_ssml = f"""<speak version='1.0' xml:lang='en-US'>
                        <voice xml:lang='en-US' name='{speaker_voice}'>
                            <break time='800ms'/>
                        </voice>
                    </speak>"""
                    pause_audio = await generate_azure_tts_rest(
                        text=pause_ssml,
                        voice=speaker_voice,
                        api_key=azure_key,
                        region=azure_endpoint
                    )
                    audio_segments.append(pause_audio)
                
                audio_segments.append(segment_audio)
                print(f"✅ Generated audio for {speaker_name}")
                
            except Exception as segment_error:
                print(f"⚠️ Error generating segment {i+1}: {segment_error}")
                # Continue with other segments
        
        # Combine all audio segments into one file
        print(f"🎵 Combining {len(audio_segments)} audio segments...")
        if audio_segments:
            # For now, just use the first segment (we'll improve this)
            # In a production system, you'd use pydub or similar to properly concatenate
            audio_content = audio_segments[0]  # Use first segment as base
            
            # Simple concatenation by appending bytes (works for MP3)
            for segment in audio_segments[1:]:
                audio_content += segment
        else:
            # Fallback: generate combined script with one voice
            audio_content = await generate_azure_tts_rest(combined_script, host_voice, azure_key, azure_endpoint)
        
        # Save audio file
        script_hash = hashlib.md5(combined_script.encode()).hexdigest()[:8]
        audio_filename = f"podcast_{script_hash}.mp3"
        audio_path = os.path.join(os.environ.get("STORE_DIR", "./store"), audio_filename)
        
        with open(audio_path, "wb") as f:
            f.write(audio_content)
        
        return {
            "audio_url": f"/v1/audio/files/{script_hash}",
            "script": combined_script,
            "duration_estimate": len(full_text.split()) * 0.5,  # Rough estimate: 0.5 seconds per word
            "speakers": len(script_parts)
        }
        
    except Exception as e:
        return {
            "audio_url": None,
            "error": f"Audio generation failed: {str(e)}"
        }


async def generate_azure_tts(text: str, voice: str, api_key: str, region: str) -> bytes:
    """Generate audio using Azure Text-to-Speech"""
    # Try to import Azure SDK one more time
    try:
        import azure.cognitiveservices.speech as speechsdk_local
        print("✅ Azure Speech SDK imported successfully in function!")
    except ImportError as e:
        print(f"❌ Azure Speech SDK still not available: {e}")
        # For now, let's create a simple HTTP-based solution
        return await generate_azure_tts_rest(text, voice, api_key, region)
    
    speechsdk = speechsdk_local
    
    # Create speech config
    speech_config = speechsdk.SpeechConfig(subscription=api_key, region=region)
    speech_config.speech_synthesis_voice_name = voice
    speech_config.set_speech_synthesis_output_format(speechsdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3)
    
    # Create synthesizer with no audio output (we'll get the data directly)
    synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=None)
    
    # Generate speech
    result = synthesizer.speak_text_async(text).get()
    
    if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
        return result.audio_data
    elif result.reason == speechsdk.ResultReason.Canceled:
        cancellation_details = result.cancellation_details
        raise Exception(f"Speech synthesis canceled: {cancellation_details.reason}")
    else:
        raise Exception(f"Speech synthesis failed: {result.reason}")


async def generate_azure_tts_rest(text: str, voice: str, api_key: str, region: str) -> bytes:
    """Generate audio using Azure TTS REST API as fallback"""
    print(f"🔄 Using Azure TTS REST API for region: {region}, voice: {voice}")
    
    # Check if text is already SSML or plain text
    if text.strip().startswith('<speak'):
        ssml = text  # Already SSML formatted
    else:
        # Create simple SSML wrapper
        ssml = f"""<speak version='1.0' xml:lang='en-US'>
            <voice xml:lang='en-US' name='{voice}'>
                {text}
            </voice>
        </speak>"""
    
    # Azure TTS REST API endpoint
    endpoint = f"https://{region}.tts.speech.microsoft.com/cognitiveservices/v1"
    
    headers = {
        'Ocp-Apim-Subscription-Key': api_key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3',
        'User-Agent': 'DocumentIntelligence'
    }
    
    try:
        response = requests.post(endpoint, headers=headers, data=ssml.encode('utf-8'), timeout=30)
        
        if response.status_code == 200:
            print("✅ Azure TTS REST API successful!")
            return response.content
        else:
            error_msg = f"Azure TTS REST API failed: {response.status_code} - {response.text}"
            print(f"❌ {error_msg}")
            raise Exception(error_msg)
            
    except requests.exceptions.RequestException as e:
        error_msg = f"Azure TTS REST API request failed: {str(e)}"
        print(f"❌ {error_msg}")
        raise Exception(error_msg)


@router.get("/audio/files/{audio_id}")
def serve_audio(audio_id: str):
    """Serve generated audio files"""
    audio_path = os.path.join(os.environ.get("STORE_DIR", "./store"), f"podcast_{audio_id}.mp3")
    
    if not os.path.exists(audio_path):
        raise HTTPException(404, "Audio file not found")
    
    return FileResponse(
        audio_path, 
        media_type="audio/mpeg", 
        filename=f"podcast_{audio_id}.mp3"
    )


@router.post("/audio/simple")
async def generate_simple_audio(
    text: str = Body(..., embed=True),
    voice: str = Body(default="en-US-AriaNeural", embed=True)
):
    """Generate simple audio from text (fallback for testing)"""
    
    if not text or len(text.strip()) == 0:
        raise HTTPException(400, "Text is required")
    
    # For demo purposes, return a mock response if Azure TTS is not configured
    tts_provider = os.environ.get("TTS_PROVIDER", "")
    if tts_provider.lower() != "azure":
        return {
            "audio_url": None,
            "message": "This would generate audio: " + text[:100] + "...",
            "demo": True
        }
    
    try:
        azure_key = os.environ.get("AZURE_TTS_KEY")
        azure_endpoint = os.environ.get("AZURE_TTS_ENDPOINT") or os.environ.get("AZURE_TTS_REGION", "eastus")
        
        if not azure_key:
            return {
                "audio_url": None,
                "error": "Missing AZURE_TTS_KEY"
            }
        
        # Generate audio
        audio_content = await generate_azure_tts(text, voice, azure_key, azure_endpoint)
        
        # Save audio file
        text_hash = hashlib.md5(text.encode()).hexdigest()[:8]
        audio_filename = f"simple_{text_hash}.mp3"
        audio_path = os.path.join(os.environ.get("STORE_DIR", "./store"), audio_filename)
        
        with open(audio_path, "wb") as f:
            f.write(audio_content)
        
        return {
            "audio_url": f"/v1/audio/simple-files/{text_hash}",
            "duration_estimate": len(text.split()) * 0.5
        }
        
    except Exception as e:
        return {
            "audio_url": None,
            "error": f"Audio generation failed: {str(e)}"
        }


@router.get("/audio/simple-files/{audio_id}")
def serve_simple_audio(audio_id: str):
    """Serve simple audio files"""
    audio_path = os.path.join(os.environ.get("STORE_DIR", "./store"), f"simple_{audio_id}.mp3")
    
    if not os.path.exists(audio_path):
        raise HTTPException(404, "Audio file not found")
    
    return FileResponse(
        audio_path, 
        media_type="audio/mpeg", 
        filename=f"simple_{audio_id}.mp3"
    )


